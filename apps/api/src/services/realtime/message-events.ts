export type MessageCreatedEvent = {
  conversationId: string;
  messageId: string;
  senderId: string;
  createdAt: Date;
};

export interface MessageEventPublisher {
  publishMessageCreated(event: MessageCreatedEvent): Promise<void>;
}

class NoopMessageEventPublisher implements MessageEventPublisher {
  async publishMessageCreated(_event: MessageCreatedEvent) {
    void _event;
    await Promise.resolve();
  }
}

export const messageEvents: MessageEventPublisher = new NoopMessageEventPublisher();
