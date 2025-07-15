import { DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
    .setTitle('Blog API')
    .setDescription('RESTful API for blog application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

export const swaggerCustomOptions: SwaggerCustomOptions = {
    swaggerOptions: {
        persistAuthorization: true,
    },
    customSiteTitle: 'Blog API Docs',
};
