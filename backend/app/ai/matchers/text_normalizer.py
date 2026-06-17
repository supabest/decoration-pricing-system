"""文本标准化预处理"""
import re


class TextNormalizer:
    """装修工程描述文本标准化"""

    SYNONYM_MAP = {
        "铺": "铺贴",
        "贴": "铺贴",
        "粉": "粉刷",
        "刷": "涂刷",
    }

    def normalize(self, text: str) -> str:
        """标准化文本"""
        text = text.strip()
        text = re.sub(r'[^一-龥a-zA-Z0-9\s]', '', text)
        for k, v in self.SYNONYM_MAP.items():
            text = text.replace(k, v)
        return text
