---
title: Face Blur and Identity Protection Guide
author: Shivek Khurana
tags: ["identity protection"]
---

All the pictures we collect will eventually be made public. Hence it's our ethical and moral duty to protect the privacy of the individual. 

## Parts of pictures to be retracted
We have a partially automated face blur mechanism. But in general the following guidelines should be adhered to:

- No part of the eye should be visible. If it's evident after blur is applied, add an extra black box
- In case of presence of a minor, a black box should be added to the entire face, not just the eye area
- Personally identifiable information, like addresses on billboards, vehicle plates and land marks should blacked out
- No personally identified information, like name, place of work etc should be used in communications, however an approximate location can be added


## Ownership and Responsibility
It's everyone's responsibilty to ensure that a beneficiary's identity is protectected. The poster of the photo owns the task. 
In the case of a distribution, the distribution handler should ensure that only blurred pictures make their way to Airtable.

## Blurring Faces

[Our faceblur software](https://github.com/Karuna2020/faceblur) is a python script that relies on OpenCV to find and blur faces.

We use a modified version of [telesoho/faceblur](https://github.com/telesoho/faceblur). Our fork has an option for the blurring process to run in parallel. 

Our version is also more forgiving when no faces are found. In the original repository, photos without faces are skipped. In our version, photos without faces are copied to output as it is. 

Our blur too, is more aggressive than the original version.

### Installation
```bash
$ pip install -r requirements.txt
```

### Usage
```bash
$ python faceblur.py src/directory sink/directory
```

### Accuracy and Verification
The script seems to handle a majority of cases, but a manual inspection is advisable. The faceblur software only blurs human faces. Addresses, vehicle numbers and other information is left intact.

### Compressing image files
Most distribution pictures are captured on a phone. We have observed a size reduction of about 40% by running iamges through python's [optimize-images](https://pypi.org/project/optimize-images/) package. Since Airtable space is limited, it's a good idea to compress before uploading.

To compress, run the following command:
```bash
$ optimize-images path/to/folder/containing/jpgs
```

### What if you don't code?
Please contact Anand or Shivek and request them to run the face blur for you.
