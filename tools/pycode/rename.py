print("Run as 'python3 tools/pycode/rename.py' ")

import io
import os
from pathlib import Path;

def rename_js_to_ts(folder:Path):
    print("Folder=", folder)
    for file in list(os.listdir(str(folder))):
        item = Path(folder / file)
        print("Item=", item);
        if item.is_dir():
            rename_js_to_ts(item)
        else:
            strItem = str(item)
            if (strItem.endswith(".js")):
                to = strItem.replace(".js",".ts");
                os.rename(strItem, to)

rename_js_to_ts(Path("src/browser/ts"))
