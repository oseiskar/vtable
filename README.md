# Virtual tabletop in the browser

## Development

    npm install

#### Node version:

    npm run server
    # go to http://localhost:3000

#### Single-player no-backend version

    BACKEND=single npm run watch
    # open build/index.html in the browser

#### Firebase version

    BACKEND=firebase npm run watch
    # open build/index.html in the browser

## Deployment

#### Firebase version

    BACKEND=firebase npm run build
    firebase deploy

#### Node version

    BACKEND=node npm run build
    # TODO

## Card digitizer

 0. `pip install -r digitizer/requirements.txt` (preferably in a virtualenv)
 1. Place a set of photos into a folder, say `digitizer/photos/input`. The
    first image in alphabetic order should be the card back image
 2. Create a black-and-white mask image `digitizer/photos/mask.png` where the
    white rectangle (AABB) determines the size and (approximate) location of
    of a card on each image
 3. Process images (see `python digitizer/photo2cards.py --help` for image processing options)

        python digitizer/photos2cards.py digitizer/photos/input \
          digitizer/photos/output \
          digitizer/photos/mask.png # [options]

 4. Convert the set of processed image to a card game

        python digitizer/images2game.py \
          digitizer/photos/output \
          digitizer/output/custom.js -js --name='My Custom Game'
