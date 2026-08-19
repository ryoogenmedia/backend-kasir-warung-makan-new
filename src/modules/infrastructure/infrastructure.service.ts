import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { LogType } from '@prisma/client';

@Injectable()
export class InfrastructureService {
  private readonly logger = new Logger(InfrastructureService.name);

  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService
  ) {}

  async getBranding() {
    try {
      const logo = await this.prisma.systemSetting.findUnique({ where: { key: 'branding_logo' } });
      const name = await this.prisma.systemSetting.findUnique({ where: { key: 'branding_name' } });

      return {
        logo: logo?.value || null,
        name: name?.value || 'RM Siantar Minang',
      };
    } catch (error) {
      this.logger.error('Failed to fetch branding from database', error);
      return {
        logo: null,
        name: 'RM Siantar Minang',
      };
    }
  }

  async getSettings() {
    try {
      const settings = await this.prisma.systemSetting.findMany();
      const result = {};
      settings.forEach(s => {
        result[s.key] = s.value;
      });
      // Default DP percentage if not set
      if (!result['reservation_dp_percent']) {
        result['reservation_dp_percent'] = '50';
      }
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch system settings from database', error);
      return {
        reservation_dp_percent: '50',
      };
    }
  }

  async updateSetting(key: string, value: string, actorId?: bigint) {
    const result = await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    if (actorId) {
      await this.auditLogsService.log(
        actorId,
        `Mengubah pengaturan sistem: ${key}`,
        'Sistem & Infrastruktur',
        `Nilai baru: ${value}`,
        LogType.info
      );
    }
    return result;
  }

  async updateBrandingName(name: string, actorId?: bigint) {
    const result = await this.prisma.systemSetting.upsert({
      where: { key: 'branding_name' },
      update: { value: name },
      create: { key: 'branding_name', value: name },
    });

    if (actorId) {
      await this.auditLogsService.log(
        actorId,
        `Mengubah nama restoran menjadi: ${name}`,
        'Sistem & Branding',
        `Nama lama sedang diproses...`,
        LogType.info
      );
    }

    return result;
  }

  async updateLogo(file: Express.Multer.File, actorId?: bigint) {
    const relativePath = `/uploads/branding/${file.filename}`;
    
    // Cleanup old logo if exists
    const oldLogo = await this.prisma.systemSetting.findUnique({ where: { key: 'branding_logo' } });
    if (oldLogo?.value && oldLogo.value.startsWith('/uploads/')) {
        const oldAbsolutePath = path.join(process.cwd(), oldLogo.value);
        if (fs.existsSync(oldAbsolutePath)) {
            try {
                fs.unlinkSync(oldAbsolutePath);
            } catch (err) {
                this.logger.error(`Failed to delete old logo: ${oldAbsolutePath}`, err);
            }
        }
    }

    // Save new logo path
    const result = await this.prisma.systemSetting.upsert({
      where: { key: 'branding_logo' },
      update: { value: relativePath },
      create: { key: 'branding_logo', value: relativePath },
    });

    if (actorId) {
      await this.auditLogsService.log(
        actorId,
        `Memperbarui logo restoran`,
        'Sistem & Branding',
        `File: ${file.filename}`,
        LogType.success
      );
    }

    return result;
  }
}
