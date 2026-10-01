import { ValidationPipe } from '@nestjs/common';
import { CreateArizaDto } from './create-ariza.dto';

describe('CreateArizaDto validation', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  it('accepts allowed multipart fields and transforms parsed coordinates', async () => {
    const result = await pipe.transform(
      {
        status: 'lost',
        itemType: 'Black bag',
        itemDescription: 'Left near the station',
        coordinates: JSON.stringify({ lat: 41.3, lng: 69.2 }),
      },
      { type: 'body', metatype: CreateArizaDto },
    );

    expect(result).toMatchObject({
      status: 'lost',
      itemType: 'Black bag',
      itemDescription: 'Left near the station',
      coordinates: { lat: 41.3, lng: 69.2 },
    });
  });
});
