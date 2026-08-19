import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as QRCode from 'qrcode';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      return await this.prisma.table.findMany();
    } catch (error) {
      console.error('Error fetching tables from database:', error);
      return [];
    }
  }

  async findOne(id: bigint) {
    try {
      return await this.prisma.table.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error('Error fetching table from database:', error);
      return null;
    }
  }

  async create(data: { name: string, capacity?: number }) {
    const table = await this.prisma.table.create({
      data,
    });
    
    // Generate QR code for the table
    // URL format: /qr/:table_id
    const qrUrl = `/qr/${table.id}`;
    const qrCodeData = await QRCode.toDataURL(qrUrl);
    
    return this.prisma.table.update({
      where: { id: table.id },
      data: { qrCode: qrCodeData },
    });
  }

  async generateQr(id: bigint) {
    const qrUrl = `/qr/${id}`;
    return QRCode.toDataURL(qrUrl);
  }

  async remove(id: bigint) {
    // Unlink orders
    await this.prisma.order.updateMany({
      where: { tableId: id },
      data: { tableId: null },
    });

    // Unlink guest sessions
    await this.prisma.guestSession.updateMany({
      where: { tableId: id },
      data: { tableId: null },
    });

    return this.prisma.table.delete({
      where: { id },
    });
  }

  async update(id: bigint, data: { name?: string; status?: import('@prisma/client').TableStatus; capacity?: number }) {
    return this.prisma.table.update({
      where: { id },
      data,
    });
  }
}
