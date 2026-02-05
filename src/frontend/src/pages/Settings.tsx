import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, Plus, Trash2, AlertTriangle, Info } from 'lucide-react';
import PinataKeyGuideDialog from '@/components/PinataKeyGuideDialog';
import { usePinataKeyValidation } from '@/hooks/usePinataKeyValidation';
import type { Project, MetadataFormat, SolanaCreator, Blockchain } from '../App';
import { buildMetadataPreview } from '../utils/metadataPresets';
import { toast } from 'sonner';

interface SettingsProps {
  project: Project;
  onUpdateProject: (updater: (project: Project) => Project) => void;
}

export default function Settings({ project, onUpdateProject }: SettingsProps) {
  const [localSettings, setLocalSettings] = useState(project.settings);
  
  const { status: keyValidationStatus, message: keyValidationMessage } = usePinataKeyValidation(
    localSettings.pinataApiKey || ''
  );

  const updateSetting = <K extends keyof typeof localSettings>(
    key: K,
    value: typeof localSettings[K]
  ) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onUpdateProject((p) => ({
      ...p,
      settings: newSettings,
    }));
  };

  // Update metadata format and sync blockchain
  const updateMetadataFormat = (format: MetadataFormat) => {
    // Map metadata format to blockchain
    const blockchainMap: Record<MetadataFormat, Blockchain> = {
      solana: 'SOL',
      ethereum: 'ETH',
      icp: 'ICP',
    };
    
    const newBlockchain = blockchainMap[format];
    const newSettings = { ...localSettings, metadataFormat: format };
    
    setLocalSettings(newSettings);
    
    // Update both settings and blockchain in a single operation
    onUpdateProject((p) => ({
      ...p,
      blockchain: newBlockchain,
      settings: newSettings,
    }));
  };

  // Solana creators management
  const addCreator = () => {
    const currentCreators = localSettings.solanaCreators || [];
    const newCreators = [...currentCreators, { address: '', share: 0 }];
    updateSetting('solanaCreators', newCreators);
  };

  const removeCreator = (index: number) => {
    const currentCreators = localSettings.solanaCreators || [];
    if (currentCreators.length <= 1) {
      toast.error('At least one creator is required');
      return;
    }
    const newCreators = currentCreators.filter((_, i) => i !== index);
    updateSetting('solanaCreators', newCreators);
  };

  const updateCreator = (index: number, field: keyof SolanaCreator, value: string | number) => {
    const currentCreators = localSettings.solanaCreators || [];
    const newCreators = [...currentCreators];
    if (field === 'address') {
      newCreators[index] = { ...newCreators[index], address: String(value) };
    } else if (field === 'share') {
      const numValue = Math.max(0, Math.min(100, parseInt(String(value)) || 0));
      newCreators[index] = { ...newCreators[index], share: numValue };
    }
    updateSetting('solanaCreators', newCreators);
  };

  // Validate creators
  const creatorsValidation = useMemo(() => {
    if (project.blockchain !== 'SOL') {
      return { valid: true, message: '' };
    }

    const creators = localSettings.solanaCreators || [];
    
    if (creators.length === 0) {
      return { valid: false, message: 'At least one creator is required' };
    }

    const totalShare = creators.reduce((sum, c) => sum + c.share, 0);
    
    if (totalShare !== 100) {
      return { valid: false, message: `Total share must equal 100% (currently ${totalShare}%)` };
    }

    const hasEmptyAddress = creators.some(c => !c.address || c.address.trim().length === 0);
    if (hasEmptyAddress) {
      return { valid: false, message: 'All creator addresses must be filled' };
    }

    return { valid: true, message: 'Creators configuration is valid' };
  }, [localSettings.solanaCreators, project.blockchain]);

  const metadataPreview = useMemo(() => {
    return buildMetadataPreview(
      project.name,
      project.symbol,
      localSettings,
      1
    );
  }, [project.name, project.symbol, localSettings]);

  // Determine publishing status
  const getPublishingStatus = () => {
    const hasKey = localSettings.pinataApiKey && localSettings.pinataApiKey.trim().length > 0;
    const hasGenerated = project.generatedNFTs.length > 0;
    const isLocked = project.collectionLocked;
    const publishingState = project.ipfsPublishing;
    const creatorsValid = creatorsValidation.valid;

    if (!hasKey) {
      return {
        step: 1,
        message: 'Add your Pinata JWT token below to get started',
        color: 'text-muted-foreground',
      };
    }

    if (project.blockchain === 'SOL' && !creatorsValid) {
      return {
        step: 2,
        message: creatorsValidation.message,
        color: 'text-amber-600 dark:text-amber-400',
      };
    }

    if (!hasGenerated) {
      return {
        step: 3,
        message: 'Go to Vault and generate your collection',
        color: 'text-blue-500',
      };
    }

    if (!isLocked) {
      return {
        step: 4,
        message: 'Review your collection in Vault, then lock it to enable upload',
        color: 'text-blue-500',
      };
    }

    if (publishingState?.status === 'uploading') {
      return {
        step: 5,
        message: `Uploading to IPFS... ${publishingState.uploadProgress || 0}%`,
        color: 'text-blue-500',
      };
    }

    if (publishingState?.status === 'uploaded') {
      return {
        step: 6,
        message: 'Upload complete! Your collection is ready to export',
        color: 'text-green-500',
      };
    }

    if (publishingState?.status === 'upload-failed') {
      return {
        step: 5,
        message: `Upload failed. ${publishingState.errorMessage || 'Please try again'}`,
        color: 'text-red-500',
      };
    }

    return {
      step: 5,
      message: 'Ready to upload! Go to Vault to start the upload',
      color: 'text-green-500',
    };
  };

  const publishingStatus = getPublishingStatus();

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left Panel - Settings Form */}
          <div className="border-r border-border">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Project settings</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure metadata and IPFS publishing
              </p>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Publishing Status */}
              <Alert className="border-2">
                <AlertDescription>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`text-sm font-medium ${publishingStatus.color}`}>
                        Step {publishingStatus.step} of 6
                      </div>
                    </div>
                    <p className="text-sm text-foreground">
                      {publishingStatus.message}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Step-by-step Guide */}
              <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">How it works</h3>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">
                      1
                    </div>
                    <p>Add your Pinata JWT (secret access token) in the field below</p>
                  </div>
                  {project.blockchain === 'SOL' && (
                    <div className="flex items-start gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">
                        2
                      </div>
                      <p>Configure Solana creators with wallet addresses and share percentages</p>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">
                      {project.blockchain === 'SOL' ? '3' : '2'}
                    </div>
                    <p>Go to Workshop and create your layers and traits</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">
                      {project.blockchain === 'SOL' ? '4' : '3'}
                    </div>
                    <p>Go to Vault and click Generate to create your collection</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">
                      {project.blockchain === 'SOL' ? '5' : '4'}
                    </div>
                    <p>Review your collection and click Lock when you're happy with it</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">
                      {project.blockchain === 'SOL' ? '6' : '5'}
                    </div>
                    <p>Click Upload to automatically upload everything to IPFS via Pinata</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">
                      {project.blockchain === 'SOL' ? '7' : '6'}
                    </div>
                    <p>Export your collection with complete IPFS links ready to use</p>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Pinata JWT Token */}
              <div className="space-y-2">
                <Label htmlFor="pinata-api-key" className="text-sm font-medium">
                  Pinata JWT (secret access token)
                </Label>
                <Input
                  id="pinata-api-key"
                  type="password"
                  value={localSettings.pinataApiKey || ''}
                  onChange={(e) => updateSetting('pinataApiKey', e.target.value)}
                  placeholder="Paste your Pinata JWT token here"
                  className="h-9 font-mono text-xs"
                />
                
                {/* Validation Status */}
                {keyValidationStatus !== 'idle' && (
                  <div className="flex items-center gap-2 text-xs">
                    {keyValidationStatus === 'checking' && (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                        <span className="text-muted-foreground">{keyValidationMessage}</span>
                      </>
                    )}
                    {keyValidationStatus === 'valid' && (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-green-600 dark:text-green-400">{keyValidationMessage}</span>
                      </>
                    )}
                    {keyValidationStatus === 'invalid' && (
                      <>
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-red-600 dark:text-red-400">{keyValidationMessage}</span>
                      </>
                    )}
                  </div>
                )}

                {/* Pinata Free Plan Limit Warning */}
                <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-xs text-blue-800 dark:text-blue-300 ml-2">
                    <strong>Note:</strong> Pinata's free plan is suitable for small to medium-sized collections. 
                    For large collections, you may need to upgrade to a paid Pinata plan to ensure sufficient storage and bandwidth.
                  </AlertDescription>
                </Alert>

                <PinataKeyGuideDialog />
              </div>

              <Separator className="my-6" />

              {/* Solana Creators - Only for SOL blockchain */}
              {project.blockchain === 'SOL' && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Solana creators</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Configure creator wallet addresses and royalty shares
                        </p>
                      </div>
                      <Button
                        onClick={addCreator}
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs focus-ring"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add
                      </Button>
                    </div>

                    {/* Creators List */}
                    <div className="space-y-2">
                      {(localSettings.solanaCreators || []).map((creator, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-muted/30 border border-border rounded-lg">
                          <div className="flex-1 space-y-2">
                            <Input
                              value={creator.address}
                              onChange={(e) => updateCreator(index, 'address', e.target.value)}
                              placeholder="Wallet address"
                              className="h-8 text-xs font-mono"
                            />
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={creator.share}
                                onChange={(e) => updateCreator(index, 'share', e.target.value)}
                                placeholder="Share %"
                                min="0"
                                max="100"
                                className="h-8 text-xs w-24"
                              />
                              <span className="text-xs text-muted-foreground">%</span>
                            </div>
                          </div>
                          <Button
                            onClick={() => removeCreator(index)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0 focus-ring"
                            disabled={(localSettings.solanaCreators || []).length <= 1}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Validation Message */}
                    {!creatorsValidation.valid && (
                      <div className="flex items-center gap-2 text-xs">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-amber-600 dark:text-amber-400">{creatorsValidation.message}</span>
                      </div>
                    )}
                    {creatorsValidation.valid && (localSettings.solanaCreators || []).length > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-green-600 dark:text-green-400">{creatorsValidation.message}</span>
                      </div>
                    )}
                  </div>

                  <Separator className="my-6" />
                </>
              )}

              {/* Dimensions (Square) */}
              <div className="space-y-2">
                <Label htmlFor="output-size" className="text-sm font-medium">
                  Dimensions (px)
                </Label>
                <Input
                  id="output-size"
                  type="number"
                  value={localSettings.outputSize}
                  onChange={(e) =>
                    updateSetting(
                      'outputSize',
                      Math.max(100, Math.min(4096, parseInt(e.target.value) || 800))
                    )
                  }
                  min="100"
                  max="4096"
                  className="h-9"
                />
                <p className="text-xs text-muted-foreground">
                  Square output size (width × height)
                </p>
              </div>

              {/* Format */}
              <div className="space-y-2">
                <Label htmlFor="format" className="text-sm font-medium">
                  Format
                </Label>
                <Select
                  value="same"
                  onValueChange={() => {}}
                  disabled
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="same">Same as assets</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="my-6" />

              {/* Metadata Format */}
              <div className="space-y-2">
                <Label htmlFor="format-preset" className="text-sm font-medium">
                  Metadata format
                </Label>
                <Select
                  value={localSettings.metadataFormat}
                  onValueChange={(value: MetadataFormat) => {
                    // Prevent ICP selection
                    if (value === 'icp') return;
                    updateMetadataFormat(value);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solana">Solana</SelectItem>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="icp" disabled>ICP (coming soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Token Name Template */}
              <div className="space-y-2">
                <Label htmlFor="token-name-template" className="text-sm font-medium">
                  Token name template
                </Label>
                <Input
                  id="token-name-template"
                  value={localSettings.tokenNameTemplate}
                  onChange={(e) => updateSetting('tokenNameTemplate', e.target.value)}
                  placeholder="{{collection}} #{{id}}"
                  className="h-9"
                />
                <p className="text-xs text-muted-foreground">
                  Use {'{{collection}}'} and {'{{id}}'} as placeholders
                </p>
              </div>

              {/* Token Description */}
              <div className="space-y-2">
                <Label htmlFor="token-description" className="text-sm font-medium">
                  Token description
                </Label>
                <Textarea
                  id="token-description"
                  value={localSettings.tokenDescription}
                  onChange={(e) => updateSetting('tokenDescription', e.target.value)}
                  placeholder="A short description for tokens..."
                  className="min-h-[80px] resize-none"
                />
              </div>

              {/* Start at Zero */}
              <div className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg">
                <div className="flex-1">
                  <Label
                    htmlFor="start-at-zero"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Start token number at 0
                  </Label>
                </div>
                <Switch
                  id="start-at-zero"
                  checked={localSettings.startTokenNumberAtZero}
                  onCheckedChange={(checked) =>
                    updateSetting('startTokenNumberAtZero', checked)
                  }
                />
              </div>

              <Separator className="my-6" />

              {/* Royalties */}
              <div className="space-y-2">
                <Label htmlFor="royalties" className="text-sm font-medium">
                  Royalties %
                </Label>
                <Input
                  id="royalties"
                  type="number"
                  value={localSettings.royaltiesPercent}
                  onChange={(e) =>
                    updateSetting(
                      'royaltiesPercent',
                      Math.max(0, Math.min(100, parseFloat(e.target.value) || 0))
                    )
                  }
                  min="0"
                  max="100"
                  step="0.1"
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {/* Right Panel - Metadata Preview */}
          <div className="bg-muted/20">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">Preview</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Live preview of exported metadata
              </p>
            </div>

            <div className="px-6 py-6">
              <div className="bg-card border border-border rounded-lg p-4">
                <pre className="text-xs text-foreground font-mono overflow-x-auto">
                  {JSON.stringify(metadataPreview, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
