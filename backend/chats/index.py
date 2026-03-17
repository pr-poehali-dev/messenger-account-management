"""Управление чатами: список чатов, создание чата, получение/отправка сообщений."""
import json
import os
import psycopg2


CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    body = json.loads(event.get('body') or '{}')

    conn = get_conn()
    cur = conn.cursor()

    try:
        if action == 'list':
            user_id = params.get('user_id')
            if not user_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'user_id required'})}

            cur.execute("""
                SELECT
                    c.id,
                    u.id, u.username, u.name, u.avatar, u.last_seen,
                    m.text, m.created_at, m.sender_id
                FROM chats c
                JOIN chat_participants cp ON cp.chat_id = c.id AND cp.user_id = %s
                JOIN chat_participants cp2 ON cp2.chat_id = c.id AND cp2.user_id != %s
                JOIN users u ON u.id = cp2.user_id
                LEFT JOIN LATERAL (
                    SELECT text, created_at, sender_id FROM messages
                    WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1
                ) m ON TRUE
                ORDER BY COALESCE(m.created_at, c.created_at) DESC
            """, (user_id, user_id))

            rows = cur.fetchall()
            chats = []
            for r in rows:
                chats.append({
                    'id': r[0],
                    'participant': {
                        'id': r[1], 'username': r[2], 'name': r[3],
                        'avatar': r[4], 'last_seen': str(r[5])
                    },
                    'last_message': {
                        'text': r[6], 'created_at': str(r[7]), 'sender_id': r[8]
                    } if r[6] else None
                })

            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'chats': chats})}

        if action == 'create':
            user_id = body.get('user_id')
            other_id = body.get('other_id')
            if not user_id or not other_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'user_id and other_id required'})}

            cur.execute("""
                SELECT c.id FROM chats c
                JOIN chat_participants cp1 ON cp1.chat_id = c.id AND cp1.user_id = %s
                JOIN chat_participants cp2 ON cp2.chat_id = c.id AND cp2.user_id = %s
            """, (user_id, other_id))
            existing = cur.fetchone()

            if existing:
                chat_id = existing[0]
            else:
                cur.execute('INSERT INTO chats DEFAULT VALUES RETURNING id')
                chat_id = cur.fetchone()[0]
                cur.execute('INSERT INTO chat_participants (chat_id, user_id) VALUES (%s, %s)', (chat_id, user_id))
                cur.execute('INSERT INTO chat_participants (chat_id, user_id) VALUES (%s, %s)', (chat_id, other_id))
                conn.commit()

            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'chat_id': chat_id})}

        if action == 'messages':
            chat_id = params.get('chat_id')
            user_id = params.get('user_id')
            since = params.get('since')

            if not chat_id or not user_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'chat_id and user_id required'})}

            cur.execute('SELECT 1 FROM chat_participants WHERE chat_id = %s AND user_id = %s', (chat_id, user_id))
            if not cur.fetchone():
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Forbidden'})}

            if since:
                cur.execute("""
                    SELECT m.id, m.text, m.sender_id, m.created_at, m.is_read,
                           u.username, u.name, u.avatar
                    FROM messages m JOIN users u ON u.id = m.sender_id
                    WHERE m.chat_id = %s AND m.created_at > %s
                    ORDER BY m.created_at ASC
                """, (chat_id, since))
            else:
                cur.execute("""
                    SELECT m.id, m.text, m.sender_id, m.created_at, m.is_read,
                           u.username, u.name, u.avatar
                    FROM messages m JOIN users u ON u.id = m.sender_id
                    WHERE m.chat_id = %s
                    ORDER BY m.created_at ASC LIMIT 100
                """, (chat_id,))

            rows = cur.fetchall()

            cur.execute("""
                UPDATE messages SET is_read = TRUE
                WHERE chat_id = %s AND sender_id != %s AND is_read = FALSE
            """, (chat_id, user_id))
            conn.commit()

            messages = [{
                'id': r[0], 'text': r[1], 'sender_id': r[2],
                'created_at': str(r[3]), 'is_read': r[4],
                'sender': {'username': r[5], 'name': r[6], 'avatar': r[7]}
            } for r in rows]

            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'messages': messages})}

        if action == 'send':
            chat_id = body.get('chat_id')
            sender_id = body.get('sender_id')
            text = (body.get('text') or '').strip()

            if not chat_id or not sender_id or not text:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нет данных'})}

            cur.execute(
                'INSERT INTO messages (chat_id, sender_id, text) VALUES (%s, %s, %s) RETURNING id, created_at',
                (chat_id, sender_id, text)
            )
            msg_id, created_at = cur.fetchone()
            conn.commit()

            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                'message': {'id': msg_id, 'text': text, 'sender_id': sender_id, 'created_at': str(created_at), 'is_read': False}
            })}

        if action == 'unread':
            user_id = params.get('user_id')
            if not user_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'user_id required'})}

            cur.execute("""
                SELECT m.chat_id, COUNT(*) as cnt
                FROM messages m
                JOIN chat_participants cp ON cp.chat_id = m.chat_id AND cp.user_id = %s
                WHERE m.sender_id != %s AND m.is_read = FALSE
                GROUP BY m.chat_id
            """, (user_id, user_id))

            rows = cur.fetchall()
            unread = {str(r[0]): r[1] for r in rows}
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'unread': unread})}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Unknown action'})}

    finally:
        cur.close()
        conn.close()