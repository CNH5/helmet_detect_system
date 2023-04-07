import cv2


def display_frame(source):
    while True:
        r, frame = source.read()
        if r:
            ret, img = cv2.imencode('.jpeg', frame)
            if ret:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + img.tobytes() + b'\r\n')
