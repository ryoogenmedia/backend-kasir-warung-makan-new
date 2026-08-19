import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';
import * as fs from 'fs';
import * as path from 'path';

// Prevent background async errors from killing the Node.js process
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

async function bootstrap() {
  try {
    // Ensure uploads directory structure exists
    const uploadDirs = ['menus', 'promos', 'payments', 'branding'];
    const baseUploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(baseUploadDir)) {
      fs.mkdirSync(baseUploadDir, { recursive: true });
    }
    for (const dir of uploadDirs) {
      const fullPath = path.join(baseUploadDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }

    // Ensure baileys auth directory structure exists
    const authDirs = ['.baileys_auth_sender', '.baileys_auth_receiver'];
    for (const dir of authDirs) {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }

    const app = await NestFactory.create(AppModule);
    
    app.enableCors(); // Fixes communication with Frontend
    app.useGlobalInterceptors(new BigIntInterceptor()); // Fixes 500 Error for JSON BigInt serialization
    
    const port = Number(process.env.PORT) || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Server running on port ${port}`);
  } catch (error) {
    console.error('❌ Error during bootstrap:', error);
  }
}
bootstrap();
