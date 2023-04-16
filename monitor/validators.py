import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

INTEGER_PATTERN = re.compile("^\\d+$")
