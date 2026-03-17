"""Регистрация, вход и обновление профиля пользователя."""
import json
import os
import hashlib
import psycopg2


CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
}


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


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
        if action == 'register':
            name = (body.get('name') or '').strip()
            username = (body.get('username') or '').strip().lower()
            password = body.get('password') or ''

            if not name or not username or not password:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните все поля'})}
            if len(password) < 6:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Пароль не менее 6 символов'})}

            cur.execute('SELECT id FROM users WHERE username = %s', (username,))
            if cur.fetchone():
                return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Имя пользователя уже занято'})}

            avatar = name[0].upper()
            pw_hash = hash_password(password)
            cur.execute(
                'INSERT INTO users (username, name, password_hash, avatar) VALUES (%s, %s, %s, %s) RETURNING id',
                (username, name, pw_hash, avatar)
            )
            user_id = cur.fetchone()[0]
            conn.commit()

            user = {'id': user_id, 'username': username, 'name': name, 'avatar': avatar, 'bio': '', 'status': ''}
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user})}

        if action == 'login':
            username = (body.get('username') or '').strip().lower()
            password = body.get('password') or ''

            if not username or not password:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните все поля'})}

            pw_hash = hash_password(password)
            cur.execute(
                'SELECT id, username, name, avatar, bio, status FROM users WHERE username = %s AND password_hash = %s',
                (username, pw_hash)
            )
            row = cur.fetchone()
            if not row:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный логин или пароль'})}

            cur.execute('UPDATE users SET last_seen = NOW() WHERE id = %s', (row[0],))
            conn.commit()

            user = {'id': row[0], 'username': row[1], 'name': row[2], 'avatar': row[3], 'bio': row[4] or '', 'status': row[5] or ''}
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user})}

        if action == 'profile':
            user_id = body.get('id')
            name = (body.get('name') or '').strip()
            bio = (body.get('bio') or '').strip()
            status = (body.get('status') or '').strip()

            if not user_id or not name:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нет данных'})}

            cur.execute(
                'UPDATE users SET name = %s, bio = %s, status = %s WHERE id = %s RETURNING id, username, name, avatar, bio, status',
                (name, bio, status, user_id)
            )
            row = cur.fetchone()
            conn.commit()

            user = {'id': row[0], 'username': row[1], 'name': row[2], 'avatar': row[3], 'bio': row[4] or '', 'status': row[5] or ''}
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user})}

        if action == 'users':
            q = params.get('q', '').strip()
            if q:
                cur.execute(
                    "SELECT id, username, name, avatar, bio, last_seen FROM users WHERE username ILIKE %s OR name ILIKE %s LIMIT 30",
                    (f'%{q}%', f'%{q}%')
                )
            else:
                cur.execute("SELECT id, username, name, avatar, bio, last_seen FROM users LIMIT 50")

            rows = cur.fetchall()
            users = [{'id': r[0], 'username': r[1], 'name': r[2], 'avatar': r[3], 'bio': r[4] or '', 'last_seen': str(r[5])} for r in rows]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'users': users})}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Unknown action'})}

    finally:
        cur.close()
        conn.close()