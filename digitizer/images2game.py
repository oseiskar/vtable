"""
Convert a set of images in a folder to a game JSON
"""
import base64, cv2, hashlib, json, os, shutil, re

def process_folder(input_folder, output_file, name, wrap_as_js_module=True, scale=1.0, asset_folder=None):
    cards = []
    back = None
    h, w = None, None
    if asset_folder is not None:
        asset_subfolder = os.path.join(asset_folder, 'assets')
        try: os.makedirs(asset_subfolder)
        except: pass
    for f in sorted(os.listdir(input_folder)):
        in_file = os.path.join(input_folder, f)
        ext = in_file.split('.')[-1]

        with open(in_file, 'rb') as f:
            bindata = f.read()

        if asset_folder is None:
            encoded = base64.b64encode(bindata).decode('ascii')

            if re.match(r'jpe?g', ext):
                mime = 'jpeg'
            elif ext == 'png':
                mime = 'png'
            else: assert(False)
            url = 'data:image/%s;base64,%s' % (mime, encoded)
        else:
            hash = hashlib.sha256()
            hash.update(bindata)
            out_fn = '%s.%s' % (hash.hexdigest(), ext)

            shutil.copyfile(in_file, os.path.join(asset_subfolder, out_fn))
            url = 'assets/' + out_fn

        if back is None:
            img = cv2.imread(in_file)
            assert(img is not None)
            h, w = img.shape[:2]
            back = url

        else:
            cards.append({
                'type': 'card',
                'faceDown': True,
                'dimensions': {
                    'width': w * scale,
                    'height': h * scale
                },
                'style': {
                  'background-image': "url('%s')" % url,
                  'background-repeat': 'no-repeat',
                  'background-size': 'cover'
                },
                'back': {
                    'style': {
                      'background-image': "url('%s')" % back,
                      'background-repeat': 'no-repeat',
                      'background-size': 'cover'
                    }
                },
                'stackId': 1
            })

    game = {
        'name': name,
        'tokens': cards,
        'stacks': {
            1: {
                'id': 1,
                'position': {
                    'x': 100,
                    'y': 100
                }
            }
        }
    }

    with open(output_file, 'wt') as out:
        text = json.dumps(game, indent=2, sort_keys=True)
        if wrap_as_js_module:
            text = 'module.exports = ' + text + ';'
        out.write(text+'\n')

if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser(__doc__)
    p.add_argument('input_folder')
    p.add_argument('output_file')
    p.add_argument('--name', default='Custom game',
        help='The name of the game')
    p.add_argument('-s', '--scale', type=float, default=1.0,
        help='Scale the images with this factor using CSS (downscaling helps retina displays and zooming)')
    p.add_argument('-js', '--wrap_as_js_module', action='store_true')
    p.add_argument('-a', '--asset_folder')
    args = p.parse_args()

    process_folder(**vars(args))
