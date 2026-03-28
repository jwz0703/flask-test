import time
def flexible_counter():
    for i in range(5):
        yield i
        time.sleep(1)

counter = flexible_counter()
for item in counter:
    print(item)