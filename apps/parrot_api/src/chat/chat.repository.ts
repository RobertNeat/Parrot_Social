import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.tokens.js';

export interface ConversationRow {
  id: string;
  created_at: Date;
  contact_id: string;
  contact_username: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_avatar_media_id: string | null;
}

export interface ChatMessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  image_media_id: string | null;
  created_at: Date;
}

// "Other participant" per conversation - DISTINCT ON picks exactly one `other` row per
// conversation even though the schema technically allows N participants, matching the
// 1:1-only model this UI actually uses (see 007-chat.xml comment).
const CONVERSATION_SELECT = `
  SELECT DISTINCT ON (c.id)
    c.id,
    c.created_at,
    other_user.id AS contact_id,
    other_user.username AS contact_username,
    other_user.first_name AS contact_first_name,
    other_user.last_name AS contact_last_name,
    other_user.avatar_media_id AS contact_avatar_media_id
  FROM conversation c
  JOIN conversation_participant me ON me.conversation_id = c.id AND me.user_id = $1
  JOIN conversation_participant other ON other.conversation_id = c.id AND other.user_id != $1
  JOIN users other_user ON other_user.id = other.user_id
`;

@Injectable()
export class ChatRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async findConversationsForUser(userId: string): Promise<ConversationRow[]> {
    // DISTINCT ON requires ORDER BY to start with c.id; wrap in a subquery to then sort
    // the deduplicated rows by created_at for display.
    const result = await this.pool.query<ConversationRow>(
      `SELECT * FROM (${CONVERSATION_SELECT} ORDER BY c.id) conversations
       ORDER BY created_at ASC, id ASC`,
      [userId],
    );
    return result.rows;
  }

  async findConversationForUser(
    conversationId: string,
    userId: string,
  ): Promise<ConversationRow | undefined> {
    const result = await this.pool.query<ConversationRow>(
      `${CONVERSATION_SELECT} AND c.id = $2`,
      [userId, conversationId],
    );
    return result.rows[0];
  }

  async isParticipant(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT 1 FROM conversation_participant WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId],
    );
    return result.rows.length > 0;
  }

  async findMessagesByConversationIds(
    conversationIds: string[],
  ): Promise<ChatMessageRow[]> {
    if (conversationIds.length === 0) return [];
    const result = await this.pool.query<ChatMessageRow>(
      `SELECT id, conversation_id, sender_id, text, image_media_id, created_at
       FROM chat_message
       WHERE conversation_id = ANY($1)
       ORDER BY created_at ASC, id ASC`,
      [conversationIds],
    );
    return result.rows;
  }

  async insertMessage(input: {
    conversationId: string;
    senderId: string;
    text: string;
    imageMediaId: string | undefined;
  }): Promise<ChatMessageRow> {
    const result = await this.pool.query<ChatMessageRow>(
      `INSERT INTO chat_message (conversation_id, sender_id, text, image_media_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, conversation_id, sender_id, text, image_media_id, created_at`,
      [
        input.conversationId,
        input.senderId,
        input.text,
        input.imageMediaId ?? null,
      ],
    );
    return result.rows[0];
  }
}
