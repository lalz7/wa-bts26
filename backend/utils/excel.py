import pandas as pd


def read_excel(file):

    df = pd.read_excel(
        file,
        dtype=str
    )

    df = df.fillna("")

    data = []

    for _, row in df.iterrows():

        data.append({
            "id": row.get("id","").strip(),
            "nama": row.get("nama","").strip(),
            "kelas": row.get("kelas","").strip(),
            "no_hp": row.get("no_hp","").strip()
        })

    return data