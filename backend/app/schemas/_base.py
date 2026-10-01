from marshmallow import Schema, pre_load


class TrimmingSchema(Schema):
    trim_fields: tuple[str, ...] = ()

    @pre_load
    def _trim(self, data, **_kwargs):
        if not isinstance(data, dict):
            return data
        for key in self.trim_fields:
            if data.get(key):
                data[key] = data[key].strip()
        return data
