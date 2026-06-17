"""从 Excel 导入价格"""
import sys


def import_prices(file_path: str, target: str):
    print(f"Importing {file_path} → {target}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_excel_prices.py <file.xlsx>")
        sys.exit(1)
    import_prices(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "enterprise")
