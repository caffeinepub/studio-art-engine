import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, ExternalLink, HelpCircle } from "lucide-react";
import { useState } from "react";

export default function PinataKeyGuideDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 h-8 text-xs transition-all duration-hover ease-apple"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          How to get your JWT token
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Getting your Pinata JWT token</DialogTitle>
          <DialogDescription>
            Follow these steps to get the correct credential
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(85vh-8rem)] pr-4">
          <div className="space-y-6">
            {/* Critical Warning */}
            <Alert className="border-amber-500/50 bg-amber-500/10 animate-fade-in-scale">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-sm">
                <strong className="text-foreground">Important:</strong> Pinata
                shows three fields when you create an API key. You must copy the{" "}
                <strong className="text-foreground">
                  JWT (secret access token)
                </strong>{" "}
                field — the other two fields (API Key and API Secret) will not
                work in this app.
              </AlertDescription>
            </Alert>

            <Separator />

            {/* What is Pinata */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                What is Pinata?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pinata is an IPFS pinning service that stores your NFT images
                and metadata permanently on the decentralized web. This app uses
                Pinata to upload your collection so it can be accessed from
                anywhere.
              </p>
            </div>

            <Separator />

            {/* Step 1 */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  1
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    Create a Pinata account
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Go to{" "}
                    <a
                      href="https://pinata.cloud"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 transition-all duration-hover ease-apple"
                    >
                      pinata.cloud
                      <ExternalLink className="h-3 w-3" />
                    </a>{" "}
                    and sign up for a free account. If you already have an
                    account, just log in.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  2
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    Navigate to API Keys
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    After logging in, find <strong>API Keys</strong> in the left
                    sidebar menu and click it.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  3
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    Create a new API key
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Click the <strong>"New Key"</strong> button. Give it a
                    descriptive name like "NFT Collection App" so you remember
                    what it's for.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 - The Critical One */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  4
                </div>
                <div className="flex-1 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Copy the JWT (secret access token)
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Pinata will show you a popup with{" "}
                    <strong>three fields</strong>:
                  </p>

                  <div className="bg-muted/50 border border-border rounded-md p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="text-xs font-mono text-muted-foreground flex-1">
                        <div className="font-semibold text-foreground mb-1">
                          API Key
                        </div>
                        <div className="text-[10px]">c3e55bbe16edb9de49b4</div>
                      </div>
                      <div className="text-xs text-red-500 font-semibold">
                        ❌ Don't use
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-start gap-2">
                      <div className="text-xs font-mono text-muted-foreground flex-1">
                        <div className="font-semibold text-foreground mb-1">
                          API Secret
                        </div>
                        <div className="text-[10px]">
                          f5359825dd345e08d238570496...
                        </div>
                      </div>
                      <div className="text-xs text-red-500 font-semibold">
                        ❌ Don't use
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-start gap-2">
                      <div className="text-xs font-mono text-muted-foreground flex-1">
                        <div className="font-semibold text-green-600 dark:text-green-400 mb-1">
                          JWT (secret access token)
                        </div>
                        <div className="text-[10px]">
                          eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                        </div>
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400 font-semibold">
                        ✓ Copy this!
                      </div>
                    </div>
                  </div>

                  <Alert className="border-green-500/50 bg-green-500/10">
                    <AlertDescription className="text-xs">
                      <strong className="text-foreground">
                        Only the JWT token will work.
                      </strong>{" "}
                      The API Key and API Secret fields are for Pinata's legacy
                      REST API and will show as "not valid" if you paste them
                      into this app.
                    </AlertDescription>
                  </Alert>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Copy the <strong>entire JWT token</strong> (it's very long,
                    usually 200+ characters). You won't be able to see it again
                    after closing the popup!
                  </p>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  5
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    Paste it into Settings
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Return to the Settings page and paste your JWT token into
                    the
                    <strong> "Pinata JWT (secret access token)"</strong> field.
                    The app will automatically validate it and show a green
                    checkmark if it's correct.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* How the app uses it */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                How this app uses your JWT
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <strong>Security:</strong> Your JWT is stored locally in
                    your browser and never sent to any server except Pinata.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <strong>When it's used:</strong> After you lock your
                    collection in the Vault and click Upload, the app uses your
                    JWT to upload images and metadata to IPFS via Pinata.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <strong>What you get:</strong> After upload completes, you
                    can export your collection with permanent IPFS URIs
                    (ipfs://...) ready for minting.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Additional tips */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                Good to know
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    Pinata's free plan includes 1 GB of storage, which works for
                    most NFT collections
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    You can view all your uploaded files on the Pinata dashboard
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    If you lose your JWT, you can create a new API key anytime
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Keep your JWT private — treat it like a password</span>
                </li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
