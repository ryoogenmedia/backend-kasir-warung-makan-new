import { Injectable, OnModuleInit, Logger, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion,
  WASocket,
} from '@whiskeysockets/baileys';
import * as qrcode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';
import pino from 'pino';
import { Boom } from '@hapi/boom';

import * as fs from 'fs';
import * as path from 'path';

@Global()
@Injectable()
export class WhatsappService implements OnModuleInit {
  private senderClient: WASocket;
  private receiverClient: WASocket;
  
  private senderState = { isReady: false, qrCode: null as string | null };
  private receiverState = { isReady: false, qrCode: null as string | null };

  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}


  private reconnectTimeouts: Record<string, any> = {};

  async onModuleInit() {
    try {
      await this.initializeClient('sender', './.baileys_auth_sender');
      await this.initializeClient('receiver', './.baileys_auth_receiver');
    } catch (err) {
      this.logger.error('Failed to initialize WhatsApp clients on module init', err);
    }
  }

  private async initializeClient(type: 'sender' | 'receiver', authPath: string) {
    if (this.reconnectTimeouts[type]) {
      clearTimeout(this.reconnectTimeouts[type]);
      this.reconnectTimeouts[type] = null;
    }

    try {
      const { state, saveCreds } = await useMultiFileAuthState(authPath);
      const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307], isLatest: false }));
      
      this.logger.log(`Using WhatsApp v${version.join('.')} (latest: ${isLatest}) for ${type}`);

      // Close previous client if exists to prevent memory leaks
      if (type === 'sender' && this.senderClient) {
        try { this.senderClient.end(undefined); } catch (e) {}
      } else if (type === 'receiver' && this.receiverClient) {
        try { this.receiverClient.end(undefined); } catch (e) {}
      }

      const client = makeWASocket({
        version,
        printQRInTerminal: false,
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Siantar Minang', 'Chrome', '1.0.0'],
      });

      if (type === 'sender') this.senderClient = client;
      else this.receiverClient = client;

      client.ev.on('creds.update', saveCreds);

      client.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.logger.log(`WhatsApp QR Code received for ${type}`);
          qrcode.toDataURL(qr, (err, url) => {
            if (type === 'sender') this.senderState.qrCode = url;
            else this.receiverState.qrCode = url;
          });
        }

        if (connection === 'close') {
          const error = (lastDisconnect?.error as Boom);
          const shouldReconnect = error?.output?.statusCode !== DisconnectReason.loggedOut;
          this.logger.warn(`WhatsApp Client (${type}) closed. Reconnecting: ${shouldReconnect}. Reason: ${error?.message || error || 'Unknown'}`);
          
          if (type === 'sender') {
            this.senderState.isReady = false;
            this.senderState.qrCode = null;
          } else {
            this.receiverState.isReady = false;
            this.receiverState.qrCode = null;
          }

          if (shouldReconnect) {
            // Schedule reconnect with 15s delay to prevent memory leak & infinite loop
            if (!this.reconnectTimeouts[type]) {
              this.reconnectTimeouts[type] = setTimeout(() => {
                this.reconnectTimeouts[type] = null;
                this.initializeClient(type, authPath);
              }, 15000);
            }
          }
        } else if (connection === 'open') {
          this.logger.log(`WhatsApp Client (${type}) is ready!`);
          if (type === 'sender') {
            this.senderState.qrCode = null;
            this.senderState.isReady = true;
          } else {
            this.receiverState.qrCode = null;
            this.receiverState.isReady = true;

            // Auto-detect number for receiver
            const user = client.user?.id;
            if (user) {
              const number = user.split(':')[0].split('@')[0];
              this.logger.log(`Detected Receiver Number: ${number}`);
              await this.updateAdminNumber(number);
            }
          }
        }
      });
    } catch (err) {
      this.logger.error(`Error initializing WhatsApp client (${type})`, err);
    }
  }

  private async updateAdminNumber(number: string) {
    try {
      await this.prisma.systemSetting.upsert({
        where: { key: 'admin_whatsapp_number' },
        update: { value: number },
        create: { key: 'admin_whatsapp_number', value: number },
      });
    } catch (err) {
      this.logger.error('Failed to auto-update admin number', err);
    }
  }

  getStatus() {
    return {
      sender: this.senderState,
      receiver: this.receiverState,
    };
  }

  async sendMessage(to: string, message: string) {
    if (!this.senderState.isReady) {
      this.logger.warn('Cannot send message, Sender Bot not ready');
      await this.logMessage(to, message, 'FAILED (Not Ready)');
      return false;
    }

    try {
      const cleanedNum = to.replace(/\D/g, '');
      const jid = cleanedNum.includes('@s.whatsapp.net') ? cleanedNum : `${cleanedNum}@s.whatsapp.net`;
      
      await this.senderClient.sendMessage(jid, { text: message });
      await this.logMessage(to, message, 'SENT');
      return true;
    } catch (error) {
      this.logger.error(`Error sending message to ${to}`, error);
      await this.logMessage(to, message, `FAILED: ${error.message}`);
      return false;
    }
  }

  async sendImage(to: string, imagePath: string, caption: string) {
    if (!this.senderState.isReady) {
      this.logger.warn('Cannot send image, Sender Bot not ready');
      await this.logMessage(to, `[Image] ${caption}`, 'FAILED (Not Ready)');
      return false;
    }

    try {
      const cleanedNum = to.replace(/\D/g, '');
      const jid = cleanedNum.includes('@s.whatsapp.net') ? cleanedNum : `${cleanedNum}@s.whatsapp.net`;
      
      const imageSource = imagePath.startsWith('http://') || imagePath.startsWith('https://')
        ? { url: imagePath }
        : fs.readFileSync(path.join(process.cwd(), imagePath));

      await this.senderClient.sendMessage(jid, { 
        image: imageSource, 
        caption: caption 
      });
      await this.logMessage(to, `[Image] ${caption}`, 'SENT');
      return true;
    } catch (error) {
      this.logger.error(`Error sending image to ${to}`, error);
      await this.logMessage(to, `[Image] ${caption}`, `FAILED: ${error.message}`);
      return false;
    }
  }

  private async logMessage(recipient: string, message: string, status: string) {
    try {
      // Truncate status to 20 characters to fit db column schema limit
      const safeStatus = status.substring(0, 20);
      await this.prisma.whatsappLog.create({
        data: {
          recipient,
          message,
          status: safeStatus,
        }
      });
    } catch (err) {
      this.logger.error('Failed to log WhatsApp message', err);
    }
  }

  async getAdminNumber() {
    const envNum = this.configService.get<string>('WHATSAPP_SENDING_NUMBER');
    if (envNum) return envNum;

    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'admin_whatsapp_number' }
    });
    return setting?.value || null;
  }
}
