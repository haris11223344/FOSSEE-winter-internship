
# Create your models here.

from django.db import models

class Dataset(models.Model):
    name = models.CharField(max_length=200)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    file = models.FileField(upload_to='datasets/')

    def __str__(self):
        return self.name

