import http.client
import os
import uuid
import mimetypes
from urllib.parse import urlencode

png_data = bytes([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,
                  0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,0x08,0x06,0x00,0x00,0x00,0x1F,0x15,0xC4,
                  0x89,0x00,0x00,0x00,0x0A,0x49,0x44,0x41,0x54,0x78,0x9C,0x63,0x00,0x01,0x00,
                  0x00,0x05,0x00,0x01,0x0D,0x0A,0x2D,0xB4,0x00,0x00,0x00,0x00,0x49,0x45,0x4E,
                  0x44,0xAE,0x42,0x60,0x82])

boundary = '----WebKitFormBoundary' + uuid.uuid4().hex
body = []

def add_field(name, value):
    body.append(f'--{boundary}')
    body.append(f'Content-Disposition: form-data; name="{name}"')
    body.append('')
    body.append(value)

add_field('orderId', 'test123')
add_field('name', 'Test User')
add_field('phone', '9999999999')
add_field('email', 'test@example.com')
add_field('whatsapp', '919999999999')

body.append(f'--{boundary}')
body.append('Content-Disposition: form-data; name="screenshot"; filename="test.png"')
body.append('Content-Type: image/png')
body.append('')

body_bytes = '\r\n'.join(body).encode('utf-8') + b'\r\n' + png_data + b'\r\n' + f'--{boundary}--\r\n'.encode('utf-8')

conn = http.client.HTTPConnection('localhost', 3000)
conn.request('POST', '/api/orders', body_bytes, {
    'Content-Type': f'multipart/form-data; boundary={boundary}',
    'Content-Length': str(len(body_bytes)),
})
res = conn.getresponse()
print(res.status, res.reason)
data = res.read()
print(data.decode('utf-8', errors='replace'))
conn.close()
