import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { AppModule } from "./app.module";
import * as dns from "dns";
dns.setDefaultResultOrder("ipv4first");

async function bootstrap() {
    const logger = new Logger("Bootstrap");
    const app = await NestFactory.create(AppModule);

    const port = process.env.PORT || 3000;
    await app.listen(port);

    logger.log(`🚀 Application running on port ${port}`);
    logger.log(`🤖 Bot is active!`);
}

bootstrap();
