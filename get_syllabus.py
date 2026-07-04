import requests
from bs4 import BeautifulSoup
import pandas as pd
from urllib.parse import urljoin
import re
import time
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")

LIST_URLS = [
    "https://syllabus.chs.nihon-u.ac.jp/op/list1_1.html",
    "https://syllabus.chs.nihon-u.ac.jp/op/list1_2.html",
    "https://syllabus.chs.nihon-u.ac.jp/op/list1_3.html",
]

OUTPUT_PATH = Path("data/nihon_chs_general_education_syllabus_2026.csv")

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}


def clean(text):
    if text is None:
        return ""
    return re.sub(r"\s+", " ", text).strip()


def clean_subject_name(text):
    text = clean(text)

    if not text:
        return ""

    parts = text.split()

    if len(parts) >= 2 and len(set(parts)) == 1:
        return parts[0]

    if len(text) % 2 == 0:
        half = len(text) // 2
        if text[:half] == text[half:]:
            return text[:half]

    return text


def fetch_soup(url):
    res = requests.get(url, headers=HEADERS, timeout=20)
    res.raise_for_status()
    res.encoding = res.apparent_encoding
    return BeautifulSoup(res.text, "html.parser")


def get_page_title(soup):
    h1 = soup.find("h1")
    if h1:
        return clean(h1.get_text(" ", strip=True))
    return ""


def extract_detail_table(dsoup):
    data = {}

    for tr in dsoup.find_all("tr"):
        cells = tr.find_all(["th", "td"])

        if len(cells) < 2:
            continue

        key = clean(cells[0].get_text(" ", strip=True))
        value = clean(cells[1].get_text(" ", strip=True))

        if key and value:
            data[key] = value

    return data


def get_value(data, candidates):
    for key in candidates:
        if key in data and data[key]:
            return data[key]
    return ""


def extract_subject_name_from_detail(dsoup):
    detail_data = extract_detail_table(dsoup)

    name = get_value(
        detail_data,
        [
            "科目名",
            "令和7年度以降入学者",
            "令和6年度以前入学者",
        ]
    )

    return clean_subject_name(name)


def save_csv(rows):
    columns = [
        "科目名",
        "先生",
        "学期",
        "学年",
        "科目群",
        "授業形態",
        "単位数",
        "評価",
        "URL",
    ]

    df = pd.DataFrame(rows)

    if df.empty:
        df = pd.DataFrame(columns=columns)
    else:
        df = df.drop_duplicates(subset=["URL"])
        df = df[columns]

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False, encoding="utf-8-sig")

    return df


def main():
    rows = []
    seen_urls = set()

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    for list_url in LIST_URLS:
        try:
            soup = fetch_soup(list_url)
        except Exception as e:
            print("一覧ページ取得失敗:", list_url, e)
            continue

        category = get_page_title(soup)
        print("カテゴリ取得中:", category)

        for tr in soup.find_all("tr"):
            tds = tr.find_all("td")

            if len(tds) < 4:
                continue

            a = tds[0].find("a", href=True)

            if a is None:
                continue

            href = a["href"]
            subject_url = urljoin(list_url, href)

            if subject_url in seen_urls:
                continue

            seen_urls.add(subject_url)

            subject_name = clean_subject_name(a.get_text(" ", strip=True))
            teacher = clean(tds[1].get_text(" ", strip=True))
            credits = clean(tds[2].get_text(" ", strip=True))
            semester = clean(tds[3].get_text(" ", strip=True))

            print(f"取得中 {len(rows) + 1}件目: [{category}] {subject_name} / {teacher}")

            try:
                dsoup = fetch_soup(subject_url)
            except Exception as e:
                print("詳細ページ取得失敗:", subject_url, e)
                continue

            detail_data = extract_detail_table(dsoup)

            detail_subject_name = extract_subject_name_from_detail(dsoup)

            if not subject_name:
                subject_name = detail_subject_name

            if not teacher:
                teacher = get_value(detail_data, ["教員名", "担当教員名", "担当者"])

            if not credits:
                credits = get_value(detail_data, ["単位数"])

            if not semester:
                semester = get_value(detail_data, ["学期", "開講学期"])

            grade = get_value(detail_data, ["学年", "配当年次"])
            course_group = get_value(detail_data, ["科目群"])
            class_style = get_value(detail_data, ["授業形態", "授業の形態"])
            evaluation = get_value(
                detail_data,
                [
                    "成績評価の方法及び基準",
                    "成績評価方法",
                    "評価",
                ]
            )

            if course_group != "総合教育科目":
                continue

            rows.append({
                "科目名": subject_name,
                "先生": teacher,
                "学期": semester,
                "学年": grade,
                "科目群": course_group,
                "授業形態": class_style,
                "単位数": credits,
                "評価": evaluation,
                "URL": subject_url,
            })

            save_csv(rows)

            time.sleep(0.5)

    df = save_csv(rows)

    print(df.head())
    print("取得件数:", len(df))
    print(f"保存完了: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()