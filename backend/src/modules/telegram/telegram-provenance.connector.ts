import { Injectable, OnModuleInit } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { ArizaService } from '../ariza/ariza.service';
import { buildTelegramProvenance } from '../../utils/telegram-provenance.util';
import { TelegramService } from './telegram.service';

type BatchContext = {
  messages: Array<{ message: any; timestamp: number }>;
  chatTitle?: string;
  chatUsername?: string;
};

@Injectable()
export class TelegramProvenanceConnector implements OnModuleInit {
  private readonly context = new AsyncLocalStorage<BatchContext>();

  constructor(
    private readonly telegramService: TelegramService,
    private readonly arizaService: ArizaService,
  ) {}

  onModuleInit() {
    const telegram = this.telegramService as any;
    const ariza = this.arizaService as any;
    const processBatch = telegram.processBatchedMessages.bind(telegram);
    const createAriza = ariza.create.bind(ariza);

    telegram.processBatchedMessages = (
      messages: BatchContext['messages'],
      chatTitle?: string,
      chatUsername?: string,
    ) => this.context.run({ messages, chatTitle, chatUsername }, () =>
      processBatch(messages, chatTitle, chatUsername),
    );

    ariza.create = (userId: string, data: any, file?: any) => {
      const batch = this.context.getStore();
      if (!batch || data?.provenance) return createAriza(userId, data, file);

      const originalText = batch.messages
        .map(({ message }) => message?.message || '')
        .filter((text) => text.trim())
        .join('\n\n');

      const provenance = buildTelegramProvenance(
        batch.messages.map(({ message }) => ({ id: message?.id, date: message?.date })),
        {
          chatTitle: batch.chatTitle,
          chatUsername: batch.chatUsername,
          originalText,
          collectedAt: new Date(),
          parserVersion: 'telegram-parser-v1',
        },
      );

      // `trustedSource` tells ArizaService this provenance was produced by the
      // ingestion pipeline itself and not copied from a request body.
      return createAriza(
        userId,
        { ...data, provenance, trustedSource: true },
        file,
      );
    };
  }
}
