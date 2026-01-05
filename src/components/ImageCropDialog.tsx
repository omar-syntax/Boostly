import { useState, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Loader2, ZoomIn } from 'lucide-react'

interface ImageCropDialogProps {
    open: boolean
    onClose: () => void
    imageSrc: string
    onCropComplete: (croppedImage: Blob) => void
}

/**
 * Create cropped image from canvas
 */
async function getCroppedImg(
    imageSrc: string,
    pixelCrop: Area
): Promise<Blob> {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        throw new Error('No 2d context')
    }

    // Set canvas size to match the crop area
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    // Draw the cropped image
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    )

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob)
            } else {
                reject(new Error('Canvas is empty'))
            }
        }, 'image/jpeg', 0.95)
    })
}

/**
 * Create image element from source
 */
function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', (error) => reject(error))
        image.src = url
    })
}

export function ImageCropDialog({
    open,
    onClose,
    imageSrc,
    onCropComplete,
}: ImageCropDialogProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const [loading, setLoading] = useState(false)

    const onCropChange = useCallback((crop: { x: number; y: number }) => {
        setCrop(crop)
    }, [])

    const onZoomChange = useCallback((zoom: number) => {
        setZoom(zoom)
    }, [])

    const onCropCompleteCallback = useCallback(
        (croppedArea: Area, croppedAreaPixels: Area) => {
            setCroppedAreaPixels(croppedAreaPixels)
        },
        []
    )

    const handleSave = async () => {
        if (!croppedAreaPixels) return

        setLoading(true)
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
            onCropComplete(croppedImage)
            onClose()
        } catch (error) {
            console.error('Error cropping image:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Crop Profile Photo</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Crop Area */}
                    <div className="relative h-[400px] bg-muted rounded-lg overflow-hidden">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            onCropChange={onCropChange}
                            onZoomChange={onZoomChange}
                            onCropComplete={onCropCompleteCallback}
                        />
                    </div>

                    {/* Zoom Control */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <ZoomIn className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Zoom</span>
                        </div>
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(value) => setZoom(value[0])}
                            className="w-full"
                        />
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Drag to reposition • Scroll or use slider to zoom
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
