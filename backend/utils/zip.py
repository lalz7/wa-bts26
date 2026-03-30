import zipfile
import os
import re


def extract_zip(file, output):

    with zipfile.ZipFile(file, 'r') as zip_ref:
        zip_ref.extractall(output)

    files = []

    for root, dirs, filenames in os.walk(output):

        for filename in filenames:

            if not filename.lower().endswith(".pdf"):
                continue

            # ambil angka di awal file
            match = re.match(r"(\d+)", filename)

            if not match:
                continue

            siswa_id = int(match.group(1))

            files.append({
                "id": siswa_id,
                "file": os.path.join(root, filename)
            })

    return files