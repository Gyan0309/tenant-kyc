import os

root = os.path.join(os.path.dirname(__file__), "..")

for dp, _, fs in os.walk(root):
    for f in fs:
        if not f.endswith(".tsx"):
            continue
        path = os.path.join(dp, f)
        text = open(path, encoding="utf-8").read()
        new = text.replace("<motion", "<div").replace("</motion>", "</div>")
        if new != text:
            open(path, "w", encoding="utf-8").write(new)
            print("fixed", path)
