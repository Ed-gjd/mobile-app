"""HTTPS 静态服务器：给手机"安全上下文"用（硬件功能 + 添加到主屏幕必需）。
用法（Windows 侧 Python）：
  C:\\Python314\\python.exe serve_https.py
证书在上级 mobile-app-certs/（私钥不放进服务目录，避免被下载）。
"""
import http.server
import ssl
import os
import socketserver

# 切到本脚本目录，用相对目录提供文件服务
BASE = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE)

PORT = 8443
CERT = os.path.join(BASE, "..", "mobile-app-certs", "cert.pem")
KEY = os.path.join(BASE, "..", "mobile-app-certs", "key.pem")

handler = http.server.SimpleHTTPRequestHandler
httpd = socketserver.ThreadingTCPServer(("0.0.0.0", PORT), handler)

ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain(certfile=CERT, keyfile=KEY)
httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)

print(f"HTTPS 服务器已启动: https://0.0.0.0:{PORT}/")
httpd.serve_forever()
