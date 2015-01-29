#!/usr/bin/env python
# create an index page and drop the links to the gamez in.
# copy the subfolders & the like to the server
import os, sys
from shutil import copytree, ignore_patterns, rmtree
app_folder = "filesafe"
user, group = ('www-data','www-data')
ignores = ['*.git', '*.pyc', '*.py']
cwd = os.getcwd().split('/')[-1]
dest = "/home/www-data/web2py/applications/{}/static/{}".format(app_folder, cwd)
index= []
main_idx = "index.html"
files = os.listdir('.')
for f in files:
    if os.path.isdir(f) and f != '.git':
        index.append({'name':"{}".format(f), "anchor":'{}/index.html'.format(f)})
header = """
<html>
<meta name="generator" content="Vim" />
<meta charset="utf-8">
<meta name="author" content="Martin Barnard" />
<meta name="email" content="barnard.martin@gmail.com" />

<body>

"""
footer = """
    </body></html>
"""
def buildIdx(files, idx, filename='index.html'):
    header = []
    for i in idx:
        header.append("<a href='{}'>{}</a>".format(i['anchor'],i['name']) )
    print "headers", header
    return header


# Open our main index.html as a new file.
try:
    fl = open(main_idx,'w') # open for writing. Remove other crap
except:
    print "cannot open file"
    fl = None
if fl:
    print "building idx..."
    mylist = buildIdx(files, index)
    fl.write(header)
    fl.write('''<ul>''')
    for f in mylist:
        fl.write('<li>{}</li>'.format(f))
    fl.write('</ul><br />{}'.format(footer))
    fl.close()


if os.path.isdir(dest):
    print "removing {}".format(dest)
    rmtree(dest)

data = '.' # grab current directory
print "copying..."
copytree(data, dest, ignore = ignore_patterns(*ignores))

print "changing ownership to {}...".format(user)
os.system('chown -Rv {}.{} {}'.format(user, group, dest))


