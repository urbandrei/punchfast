import json
from bs4 import BeautifulSoup

def extract_jsonld(html: str):
    out = []
    try:
        soup = BeautifulSoup(html, "lxml")
        for tag in soup.find_all("script", {"type": "application/ld+json"}):
            try:
                data = json.loads(tag.text.strip())
                if isinstance(data, dict):
                    out.append(data)
                elif isinstance(data, list):
                    out.extend([d for d in data if isinstance(d, dict)])
            except Exception:
                continue
    except Exception:
        pass
    return out

def harvest_schema_cues(jsonlds):
    types = set()
    menu_items = []
    try:
        for obj in jsonlds:
            t = obj.get("@type")
            if isinstance(t, list):
                for x in t:
                    if isinstance(x, str):
                        types.add(x.lower())
            elif isinstance(t, str):
                types.add(t.lower())
            # menu-ish
            if obj.get("@type") in ("Menu","MenuSection","MenuItem") or "Menu" in str(obj.get("@type")):
                name = obj.get("name")
                if isinstance(name, str):
                    menu_items.append(name.lower())
                for key in ("hasMenu","hasMenuSection","hasMenuItem","menu","menuSection","menuItem","hasMenuItem"):
                    val = obj.get(key)
                    if isinstance(val, list):
                        for v in val:
                            if isinstance(v, dict):
                                nm = v.get("name")
                                if isinstance(nm, str):
                                    menu_items.append(nm.lower())
    except Exception:
        pass
    return {"types": list(types), "menu_items": list(set(menu_items))}
