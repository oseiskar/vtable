"""
Process a folder of photos and transform them to automatically cropped
card images.
"""
import os
import cv2
import numpy as np

def load_mask(mask_image):
    "Find the rectangle that contains all non-zero (non-black) pixels"
    mask_mat = cv2.imread(mask_image)
    assert(mask_mat is not None)

    if len(mask_mat.shape) > 2: mask_mat = mask_mat[:,:,0]

    col_mask = np.nonzero(np.max(mask_mat, axis=0) > 0)[0]
    row_mask = np.nonzero(np.max(mask_mat, axis=1) > 0)[0]

    x0 = col_mask[0]
    x1 = col_mask[-1]+1
    y0 = row_mask[0]
    y1 = row_mask[-1]+1

    return (x0, x1, y0, y1)

def rotate_image(img, deg):
    deg = -deg # CW -> CCW

    rots_90 = np.round(deg / 90)
    img = np.rot90(img, rots_90)
    deg = deg - rots_90*90

    h, w =  img.shape[:2]
    M = cv2.getRotationMatrix2D((w*0.5, h*0.5), deg, scale=1.0)
    return cv2.warpAffine(img, M, (w, h))

def process_single(in_file, out_file, mask_rect, box_blur_width=1, normalize=False, normalize_quantile=0.0, width=0, rotation=0.0):
    print(in_file, out_file)
    in_mat = cv2.imread(in_file)
    assert(in_mat is not None)

    (x0, x1, y0, y1) = mask_rect
    img = in_mat[y0:y1, x0:x1, ...]

    if box_blur_width > 0:
        kernel = np.ones((box_blur_width, box_blur_width))
        kernel = kernel / np.sum(kernel)
        img = cv2.filter2D(img, -1, kernel)

    if normalize:
        gray = np.mean(img, axis=2)
        if normalize_quantile > 0.0:
            q =normalize_quantile
            min = np.quantile(gray, q)
            max = np.quantile(gray, 1.0-q)
        else:
            min = np.min(gray)
            max = np.max(gray)
        img = np.minimum(255, np.maximum(0, (img - min) * 255 / (max - min)))

    if rotation != 0.0:
        img = rotate_image(img, rotation)

    if width > 0:
        img = cv2.resize(img, (width, img.shape[0]*width//img.shape[1]), cv2.INTER_AREA)

    cv2.imwrite(out_file, img)

def process_folder(input_folder, output_folder, mask_image, **options):
    try: os.makedirs(output_folder)
    except: pass

    mask = load_mask(mask_image)
    for idx, f in enumerate(sorted(os.listdir(input_folder))):
        in_file = os.path.join(input_folder, f)
        ext = in_file.split('.')[-1]
        out_file = os.path.join(output_folder, '%03d.%s' % (idx+1, ext))
        process_single(in_file, out_file, mask, **options)

if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser(__doc__)
    p.add_argument('input_folder')
    p.add_argument('output_folder')
    p.add_argument('mask_image')
    p.add_argument('-bb', '--box_blur_width', type=int, default=1)
    p.add_argument('-n', '--normalize', action='store_true')
    p.add_argument('-q', '--normalize_quantile', type=float, default=0.0)
    p.add_argument('-w', '--width', type=int, default=0)
    p.add_argument('-r', '--rotation', type=float, default=0.0)
    args = p.parse_args()

    process_folder(**vars(args))
