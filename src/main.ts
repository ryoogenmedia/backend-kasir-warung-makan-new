import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
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

  const app = await NestFactory.create(AppModule);
  
  app.enableCors(); // Fixes communication with Frontend
  app.useGlobalInterceptors(new BigIntInterceptor()); // Fixes 500 Error for JSON BigInt serialization
  
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
