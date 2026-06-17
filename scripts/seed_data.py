"""导入种子数据"""
import json
import os


def load_seed(file_name: str):
    path = os.path.join("data", "seeds", file_name)
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return []


def seed():
    quotas = load_seed("national_quota.json")
    print(f"Loaded {len(quotas)} quotas")


if __name__ == "__main__":
    seed()
