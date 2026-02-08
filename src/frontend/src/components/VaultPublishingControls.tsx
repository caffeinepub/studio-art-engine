import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Unlock, Upload, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmDestructive } from '@/hooks/useConfirmDestructive';
import { uploadCollectionToIPFS } from '@/utils/ipfsPublishing';
import HoverTooltip from './HoverTooltip';
import type { Project } from '../App';

interface VaultPublishingControlsProps {
  project: Project;
  onUpdateProject: (updater: (project: Project) => Project) => void;
}

export default function VaultPublishingControls({ project, onUpdateProject }: VaultPublishingControlsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { confirm } = useConfirmDestructive();

  const hasGenerated = project.generatedNFTs.length > 0;
  const hasValidKey = project.settings.pinataApiKey && project.settings.pinataApiKey.trim().length > 0;
  const isLocked = project.collectionLocked || false;
  const publishingState = project.ipfsPublishing;
  const isCurrentlyUploading = publishingState?.status === 'uploading';
  const hasUploaded = publishingState?.status === 'uploaded';
  const hasFailed = publishingState?.status === 'upload-failed';

  // Determine what actions are available
  const canLock = hasGenerated && !isLocked && !hasUploaded;
  const canUnlock = isLocked || hasUploaded;
  const canUpload = hasGenerated && hasValidKey && isLocked && !isCurrentlyUploading && !hasUploaded;
  const canRetry = hasGenerated && hasValidKey && hasFailed;

  // Handle Lock
  const handleLock = () => {
    onUpdateProject((p) => ({
      ...p,
      collectionLocked: true,
      ipfsPublishing: {
        ...p.ipfsPublishing,
        status: 'ready-to-upload',
      },
    }));
    toast.success('Collection locked and ready to upload');
  };

  // Handle Unlock (destructive)
  const handleUnlock = async () => {
    const confirmed = await confirm({
      title: 'Unlock collection?',
      description: hasUploaded 
        ? 'Unlocking will allow you to regenerate the collection, but you will need to re-upload to IPFS.'
        : 'Unlocking will allow you to regenerate the collection. You can lock it again when ready.',
    });

    if (confirmed) {
      onUpdateProject((p) => ({
        ...p,
        collectionLocked: false,
        ipfsPublishing: {
          status: 'ready',
          uploadProgress: undefined,
          errorMessage: undefined,
          imageDirCID: undefined,
          metadataCID: undefined,
        },
      }));
      toast.success('Collection unlocked');
    }
  };

  // Handle Upload
  const handleUpload = async () => {
    if (!project.settings.pinataApiKey) {
      toast.error('Pinata JWT token is required');
      return;
    }

    setIsUploading(true);

    // Set uploading state
    onUpdateProject((p) => ({
      ...p,
      ipfsPublishing: {
        ...p.ipfsPublishing,
        status: 'uploading',
        uploadProgress: 0,
        errorMessage: undefined,
      },
    }));

    try {
      const result = await uploadCollectionToIPFS(
        project.settings.pinataApiKey,
        project.generatedNFTs,
        project.name,
        project.symbol,
        project.settings,
        (progress) => {
          onUpdateProject((p) => ({
            ...p,
            ipfsPublishing: {
              ...p.ipfsPublishing,
              status: 'uploading',
              uploadProgress: Math.round(progress.percentage),
            },
          }));
        }
      );

      if (result.success) {
        onUpdateProject((p) => ({
          ...p,
          ipfsPublishing: {
            status: 'uploaded',
            uploadProgress: 100,
            errorMessage: undefined,
            imageDirCID: result.imageDirCID,
            metadataCID: result.metadataCID,
          },
        }));
        toast.success('Collection uploaded to IPFS successfully!');
      } else {
        // Preserve imageDirCID if it was returned (partial success)
        onUpdateProject((p) => ({
          ...p,
          ipfsPublishing: {
            ...p.ipfsPublishing,
            status: 'upload-failed',
            errorMessage: result.error || 'Upload failed',
            imageDirCID: result.imageDirCID || p.ipfsPublishing?.imageDirCID,
          },
        }));
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUpdateProject((p) => ({
        ...p,
        ipfsPublishing: {
          ...p.ipfsPublishing,
          status: 'upload-failed',
          errorMessage,
        },
      }));
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // Determine status message
  const getStatusMessage = () => {
    if (!hasGenerated) {
      return {
        icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
        text: 'Generate your collection first',
        color: 'text-amber-600 dark:text-amber-400',
      };
    }

    if (!hasValidKey) {
      return {
        icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
        text: 'Add your Pinata JWT token in Settings',
        color: 'text-amber-600 dark:text-amber-400',
      };
    }

    if (hasUploaded) {
      return {
        icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
        text: `Uploaded successfully! Metadata CID: ${publishingState?.metadataCID || 'N/A'}`,
        color: 'text-green-600 dark:text-green-400',
      };
    }

    if (isCurrentlyUploading) {
      return {
        icon: <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />,
        text: `Uploading to IPFS... ${publishingState?.uploadProgress || 0}%`,
        color: 'text-blue-600 dark:text-blue-400',
      };
    }

    if (hasFailed) {
      return {
        icon: <XCircle className="h-3.5 w-3.5 text-red-500" />,
        text: `Upload failed: ${publishingState?.errorMessage || 'Unknown error'}`,
        color: 'text-red-600 dark:text-red-400',
      };
    }

    if (isLocked) {
      return {
        icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
        text: 'Collection locked and ready to upload',
        color: 'text-green-600 dark:text-green-400',
      };
    }

    return {
      icon: <AlertTriangle className="h-3.5 w-3.5 text-blue-500" />,
      text: 'Lock your collection to enable upload',
      color: 'text-blue-600 dark:text-blue-400',
    };
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="space-y-2.5">
      {/* Compact Status Alert */}
      <Alert className="border py-2 px-3">
        <AlertDescription>
          <div className="flex items-center gap-2">
            {statusMessage.icon}
            <span className={`text-xs font-medium ${statusMessage.color}`}>
              {statusMessage.text}
            </span>
          </div>
        </AlertDescription>
      </Alert>

      {/* Action Buttons with Hover Tooltips */}
      <div className="flex items-center gap-2">
        {/* Lock Button */}
        <HoverTooltip content="Prevents regeneration and enables upload.">
          <Button
            onClick={handleLock}
            disabled={!canLock}
            variant={isLocked ? 'outline' : 'default'}
            size="sm"
            className="h-9 px-4 font-semibold text-xs focus-ring"
          >
            <Lock className="w-3.5 h-3.5 mr-1.5" />
            Lock
          </Button>
        </HoverTooltip>

        {/* Unlock Button */}
        <HoverTooltip content="Allows regeneration but clears upload status.">
          <Button
            onClick={handleUnlock}
            disabled={!canUnlock}
            variant="outline"
            size="sm"
            className="h-9 px-4 font-semibold text-xs focus-ring"
          >
            <Unlock className="w-3.5 h-3.5 mr-1.5" />
            Unlock
          </Button>
        </HoverTooltip>

        {/* Upload Button */}
        <HoverTooltip content="Uploads images and metadata to IPFS via Pinata.">
          <Button
            onClick={handleUpload}
            disabled={!canUpload && !canRetry}
            variant={canUpload || canRetry ? 'default' : 'outline'}
            size="sm"
            className="h-9 px-4 font-semibold text-xs focus-ring"
          >
            {isCurrentlyUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                {canRetry ? 'Retry Upload' : 'Upload'}
              </>
            )}
          </Button>
        </HoverTooltip>
      </div>
    </div>
  );
}
