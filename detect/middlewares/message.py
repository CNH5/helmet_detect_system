import time

import zmq

import detect.message as message

from django.utils.deprecation import MiddlewareMixin


class MessageMiddleware(MiddlewareMixin):
    @staticmethod
    def process_request(request):
        if not request.session.exists(request.session.session_key):
            request.session.create()
        sub = message.SUB_POOL.get(request.session.session_key, None)
        if sub:
            # 更新请求时间
            sub["last-request-time"] = time.time()
        else:
            sub = message.content.socket(zmq.SUB)
            sub.connect(f"tcp://localhost:{message.PUB_PORT}")
            sub.setsockopt_string(zmq.SUBSCRIBE, "")

            message.SUB_POOL[request.session.session_key] = {
                "sub": sub,
                "last-request-time": time.time()
            }
