// modulo de oferta
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
 
import { OffersController } from './offers.controller';
import { OfferRepository } from 'src/db/offer.repository';
import { Offer, OfferSchema } from 'src/db/offer.schema';
import { OffersService } from './offers.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Offer.name, schema: OfferSchema }]),
  ],
  controllers: [OffersController],
  providers: [OfferRepository, OffersService],
  exports: [OfferRepository],
})
export class OffersModule {}
