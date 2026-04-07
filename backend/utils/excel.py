import pandas as pd


def read_excel(file):

    df = pd.read_excel(
        file,
        dtype=str
    )

    df = df.fillna("")

    data = []
    skipped = []

    for index, row in df.iterrows():

        raw_id = row.get("id","").strip()

        if raw_id.endswith(".0"):
            raw_id = raw_id[:-2]

        if not raw_id.isdigit():
            skipped.append({
                "row": index + 2,
                "reason": "ID kosong atau bukan angka"
            })
            continue

        data.append({
            "id": int(raw_id),
            "nama": row.get("nama","").strip(),
            "kelas": row.get("kelas","").strip(),
            "no_hp": row.get("no_hp","").strip()
        })

    return {
        "rows": data,
        "skipped": skipped
    }
