from django import forms
from . import validators


class InsertForm(forms.Form):
    name = forms.CharField(
        min_length=1,
        max_length=20,
        error_messages={
            "required": "监控名不能为空",
            "invalid": "监控名长度应在20个字符以内",
        },
    )
    source = forms.CharField(
        widget=forms.Textarea,
        error_messages={
            "required": "监控源不能为空",
        },
    )
    detect = forms.BooleanField(
        required=False,
        error_messages={
            "invalid": "detect字段有误",
        },
    )


class InfoUpdateForm(forms.Form):
    name = forms.CharField(
        min_length=1,
        max_length=20,
        error_messages={
            "required": "监控名不能为空",
            "invalid": "监控名长度应在20个字符以内",
        },
    )
    source = forms.CharField(
        widget=forms.Textarea,
        error_messages={
            "required": "监控名不能为空",
        },
    )


class QueryForm(forms.Form):
    current_page = forms.IntegerField(required=False)
    page_size = forms.IntegerField(required=False)
    order = forms.CharField(required=False)
    query_filter = forms.JSONField(required=False)


class DetectUpdateForm(forms.Form):
    pk_list = forms.JSONField(
        error_messages={
            "invalid": "pk_list格式错误",
        }
    )
    detect = forms.BooleanField(
        required=False,
        error_messages={
            "invalid": "detect字段有误",
        }
    )


class DeleteForm(forms.Form):
    pk_list = forms.JSONField(
        error_messages={
            "invalid": "pk_list格式错误",
        }
    )
