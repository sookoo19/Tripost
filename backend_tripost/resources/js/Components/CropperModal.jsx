import { useRef, useEffect } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';

export default function CropperModal({ src, onClose, onCrop }) {
  const cropperRef = useRef();

  // cropBoxを丸くする
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .cropper-crop-box, .cropper-view-box {
        border-radius: 50% !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleCrop = () => {
    const cropper = cropperRef.current.cropper;
    const croppedCanvas = cropper.getCroppedCanvas();
    // 元画像のサイズを取得
    const originalWidth = croppedCanvas.width;
    const originalHeight = croppedCanvas.height;
    // 最大500pxにリサイズ
    let targetWidth = originalWidth;
    let targetHeight = originalHeight;
    if (originalWidth > originalHeight && originalWidth > 500) {
      targetWidth = 500;
      targetHeight = Math.round((originalHeight / originalWidth) * 500);
    } else if (originalHeight >= originalWidth && originalHeight > 500) {
      targetHeight = 500;
      targetWidth = Math.round((originalWidth / originalHeight) * 500);
    }
    // リサイズして圧縮
    cropper
      .getCroppedCanvas({
        width: targetWidth,
        height: targetHeight,
        imageSmoothingQuality: 'high',
      })
      .toBlob(
        blob => {
          onCrop(new File([blob], 'cropped.jpg', { type: blob.type }));
          onClose();
        },
        'image/jpeg',
        0.7 // 圧縮率
      );
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white p-4 rounded shadow-lg'>
        <Cropper
          src={src}
          style={{ height: 300, width: 300 }}
          aspectRatio={1}
          guides={false}
          ref={cropperRef}
          viewMode={1}
          dragMode='move'
          background={false}
          responsive={true}
          autoCropArea={1}
          checkOrientation={false}
        />
        <div className='flex justify-end gap-2 mt-2'>
          <button
            type='button'
            className='px-4 py-1 rounded bg-gray-300'
            onClick={onClose}
          >
            キャンセル
          </button>
          <button
            type='button'
            className='px-4 py-1 rounded bg-blue-600 text-white'
            onClick={handleCrop}
          >
            トリミングして決定
          </button>
        </div>
      </div>
    </div>
  );
}
