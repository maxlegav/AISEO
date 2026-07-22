import mongoose, { Schema, Document, models, model } from 'mongoose';

/**
 * WebhookEvent: idempotency ledger for Stripe webhooks.
 *
 * Stripe explicitly retries webhook deliveries (including in success cases when
 * the network drops the ack), so handlers must be idempotent. We achieve this by
 * recording every event.id we have processed and refusing to process a second
 * delivery of the same id.
 *
 * Lifecycle:
 *   1. On webhook receipt, after signature verification, attempt to insert a
 *      row keyed on `eventId`. The unique index makes this race-safe.
 *   2. If the insert succeeds, run the handler. On success leave the row in
 *      place forever. On failure, delete the row so Stripe's retry can re-run.
 *   3. If the insert fails with E11000 (duplicate key), the event has already
 *      been processed (or is being processed concurrently), so return 200 and
 *      skip the handler.
 */
export interface IWebhookEvent extends Document {
  eventId: string;
  type: string;
  receivedAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

const WebhookEvent = (models?.WebhookEvent || model<IWebhookEvent>('WebhookEvent', WebhookEventSchema)) as mongoose.Model<IWebhookEvent>;
export default WebhookEvent;
