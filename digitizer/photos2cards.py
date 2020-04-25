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

def rotate_image(img, deg, mask_rect):
    deg = -deg # CW -> CCW
    h, w =  img.shape[:2]

    (x0, x1, y0, y1) = mask_rect
    rots_90 = np.round(deg / 90)

    img = np.rot90(img, rots_90)
    deg = deg - rots_90*90
    rots_90 = rots_90 % 4

    # rotate mask rect (quite ugly)
    while rots_90 != 0:
        w, h = h, w
        if rots_90 > 0:
            f = lambda x, y: (y, h-x)
            rots_90 -= 1
        else:
            f = lambda x, y: (w-y, x)
            rots_90 += 1
        x0, y0 = f(x0, y0)
        x1, y1 = f(x1, y1)

    x0, x1 = min(x0, x1), max(x0, x1)
    y0, y1 = min(y0, y1), max(y0, y1)
    mask_rect = (x0, x1, y0, y1)

    if deg != 0:
        M = cv2.getRotationMatrix2D(((x0+x1)*0.5, (y0+y1)*0.5), deg, scale=1.0)
        img = cv2.warpAffine(img, M, (w, h))

    return img, mask_rect

def process_single(in_file, out_file, mask_rect,
    box_blur_width=1,
    normalize_quantile=-1,
    width=0,
    rotation=0.0,
    auto_center_margin=0):

    print(in_file, out_file)
    img = cv2.imread(in_file)
    assert(img is not None)

    if rotation != 0.0:
        img, mask_rect = rotate_image(img, rotation, mask_rect)

    def rect_with_margin(rect, margin):
        (x0, x1, y0, y1) = mask_rect
        x0m = max(x0 - margin, 0)
        y0m = max(y0 - margin, 0)
        x1m = min(x1 + margin, img.shape[1])
        y1m = min(y1 + margin, img.shape[0])
        return (x0m, x1m, y0m, y1m)

    if box_blur_width > 0:
        x0b, x1b, y0b, y1b = rect_with_margin(mask_rect, box_blur_width + auto_center_margin)
        kernel = np.ones((box_blur_width, box_blur_width))
        kernel = kernel / np.sum(kernel)
        img[y0b:y1b, x0b:x1b, ...] = cv2.filter2D(img[y0b:y1b, x0b:x1b, ...], -1, kernel)

    if auto_center_margin > 0:
        (x0, x1, y0, y1) = mask_rect
        w = x1 - x0
        h = y1 - y0
        x0b, x1b, y0b, y1b = rect_with_margin(mask_rect, auto_center_margin)
        img = img[y0b:y1b, x0b:x1b, ...]
        xrng = img.shape[1] - w
        yrng = img.shape[0] - h

        gray = np.mean(img, axis=2)
        col_mean = np.ravel(np.mean(gray, axis=0))
        row_mean = np.ravel(np.mean(gray, axis=1))
        col_mid = 0.5*(np.max(col_mean)+np.min(col_mean))
        row_mid = 0.5*(np.max(row_mean)+np.min(row_mean))

        col_arr = col_mean > col_mid
        row_arr = row_mean > row_mid
        col_arr = np.hstack([col_arr[:xrng], col_arr[-xrng:]])
        row_arr = np.hstack([row_arr[:yrng], row_arr[-yrng:]])

        #import matplotlib.pyplot as plt
        #plt.imshow(gray)
        #plt.show()

        def get_mid(arr, rng):
            mid = 0.5*(np.max(arr)+np.min(arr))
            arr = np.hstack([arr[:rng], arr[-rng:]])
            changes = np.nonzero(np.diff(arr > mid))[0]
            mid = np.ceil((changes[0] + changes[-1])*0.5)
            #plt.plot(arr)
            return int(round(mid / 2))

        x0 = get_mid(col_mean, xrng)
        y0 = get_mid(row_mean, yrng)

        #plt.show()
        x1 = x0+w
        y1 = y0+h
        mask_rect = (x0, x1, y0, y1)
        #print(mask_rect)

    (x0, x1, y0, y1) = mask_rect
    img = img[y0:y1, x0:x1, ...]

    if normalize_quantile >= 0.0:
        gray = np.mean(img, axis=2)
        if normalize_quantile > 0.0:
            q = normalize_quantile
            minb = np.quantile(gray, q)
            maxb = np.quantile(gray, 1.0-q)
        else:
            minb = np.min(gray)
            maxb = np.max(gray)
        img = np.minimum(255, np.maximum(0, (img - minb) * 255 / (maxb - minb)))

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
    p.add_argument('-n', '--normalize_quantile', type=float, default=-1)
    p.add_argument('-w', '--width', type=int, default=0)
    p.add_argument('-a', '--auto_center_margin', type=int, default=0)
    p.add_argument('-r', '--rotation', type=float, default=0.0)
    args = p.parse_args()

    process_folder(**vars(args))
