import time
import zmq
import threading

from django.contrib.sessions.models import Session
from django.db.models import F

from monitor.models import MonitorInfo
from helmet_detect_system import settings

content = zmq.Context()

_warning_pull = content.socket(zmq.PULL)
PULL_PORT = _warning_pull.bind_to_random_port("tcp://*")
print(f"warning pull port: {PULL_PORT}")

_warning_pub = content.socket(zmq.PUB)
PUB_PORT = _warning_pub.bind_to_random_port("tcp://*")
print(f"warning publish port: {PUB_PORT}")

SUB_POOL = {}


def publish_warning():
    """
    广播警报
    """
    while True:
        try:
            data = _warning_pull.recv_json(zmq.NOBLOCK)
            if len(SUB_POOL) > 0:
                if data["head_without_helmet"] > 0:
                    # 有用户，识别到未佩戴安全帽，广播警报
                    _warning_pub.send_json(data)
            else:
                # 没有用户，更新缓存信息条数
                MonitorInfo.objects.filter(id=data["monitor_id"]).update(message_count=F("message_count") + 1)
        except zmq.ZMQError:
            time.sleep(settings.PUBLISH_INTERVAL)


warning_pub_thread = threading.Thread(
    name="warning-publish-thread",
    target=publish_warning,
    daemon=True,
)
warning_pub_thread.start()


def sub_clean():
    """
    清除长期未访问的sub
    """
    while True:
        session_keys = []
        for key in SUB_POOL.keys():
            sub = SUB_POOL[key]
            if time.time() > sub["last-request-time"] + settings.SUB_TIMEOUT_INTERVAL:
                session_keys.append(key)
                del SUB_POOL[key]
        Session.objects.filter(pk__in=session_keys).delete()
        time.sleep(settings.SUB_CLEAN_INTERVAL)


sub_clean_thread = threading.Thread(
    name="sub_clean-thread",
    target=sub_clean,
    daemon=True
)
sub_clean_thread.start()
