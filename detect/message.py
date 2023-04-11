import threading
import time

import zmq

content = zmq.Context()
_warning_pull = content.socket(zmq.PULL)
PORT = _warning_pull.bind_to_random_port("tcp://*")
print(f"zmq port: {PORT}")
_warning_pool = []


def listen_warning():
    while True:
        try:
            data = _warning_pull.recv_json(zmq.NOBLOCK)
            # 将警报添加到消息池
            print(data)
        except zmq.ZMQError:
            time.sleep(0.5)


warning_listen_thread = threading.Thread(target=listen_warning)
warning_listen_thread.name = "warning-listen-thread"
warning_listen_thread.daemon = True
warning_listen_thread.start()
