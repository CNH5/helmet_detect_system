import zmq

content = zmq.Context()
pub = content.socket(zmq.PUB)
pub.bind("tcp://*:5556")
