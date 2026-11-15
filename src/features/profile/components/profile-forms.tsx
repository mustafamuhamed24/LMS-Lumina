'use client';

import { useActionState } from 'react';
import { Camera, Loader2, Lock, Save, Trash2, UserRound } from 'lucide-react';
import {
  changePasswordAction,
  removeAvatarAction,
  updateProfileAction,
  uploadAvatarAction,
} from '@/features/profile/actions';
import { initialFormState, type FormState } from '@/lib/form-state';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, initials, initialsColor } from '@/lib/utils';

function Feedback({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <Alert variant={state.status === 'success' ? 'success' : 'destructive'}>
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}

export function ProfileForm({
  profile,
}: {
  profile: { id: string; full_name: string; email: string; headline: string | null; bio: string | null; avatar_url: string | null };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfileAction, initialFormState);
  const [avatarState, avatarAction, avatarPending] = useActionState<FormState, FormData>(uploadAvatarAction, initialFormState);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <Card>
        <CardHeader>
          <CardTitle>Profile photo</CardTitle>
          <CardDescription>Shown on discussions, certificates and your dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
              <AvatarFallback className={cn('text-lg font-semibold', initialsColor(profile.id))}>
                {initials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{profile.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          <Feedback state={avatarState} />

          <form action={avatarAction} className="space-y-2">
            <Label htmlFor="avatar">Upload a new image</Label>
            <Input id="avatar" name="avatar" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP or GIF up to 2 MB.</p>
            <Button type="submit" size="sm" variant="outline" disabled={avatarPending}>
              {avatarPending ? <Loader2 className="animate-spin" /> : <Camera />}
              {avatarPending ? 'Uploading…' : 'Upload photo'}
            </Button>
          </form>

          {profile.avatar_url ? (
            <form action={removeAvatarAction}>
              <Button type="submit" size="sm" variant="ghost" className="text-muted-foreground">
                <Trash2 /> Remove photo
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
          <CardDescription>Your name appears on certificates and learner records.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4" noValidate>
            <Feedback state={state} />
            <div className="space-y-2">
              <Label htmlFor="profile-name">Full name</Label>
              <Input id="profile-name" name="fullName" defaultValue={profile.full_name} required maxLength={80} />
              {state.fieldErrors?.fullName ? <p className="text-xs text-destructive">{state.fieldErrors.fullName[0]}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email address</Label>
              <Input id="profile-email" value={profile.email} disabled readOnly />
              <p className="text-xs text-muted-foreground">Contact an administrator to change your sign-in email.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-headline">Headline</Label>
              <Input
                id="profile-headline"
                name="headline"
                defaultValue={profile.headline ?? ''}
                maxLength={160}
                placeholder="Learning experience designer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-bio">About you</Label>
              <Textarea
                id="profile-bio"
                name="bio"
                defaultValue={profile.bio ?? ''}
                rows={5}
                maxLength={1000}
                placeholder="A short introduction visible on your public instructor profile."
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Save />}
              {pending ? 'Saving…' : 'Save profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePasswordAction, initialFormState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="size-4" /> Password
        </CardTitle>
        <CardDescription>Use at least eight characters with a letter and a number.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 sm:grid-cols-3" noValidate>
          <div className="space-y-2 sm:col-span-3">
            <Feedback state={state} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required />
            {state.fieldErrors?.currentPassword ? (
              <p className="text-xs text-destructive">{state.fieldErrors.currentPassword[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" name="password" type="password" autoComplete="new-password" required />
            {state.fieldErrors?.password ? <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required />
            {state.fieldErrors?.confirmPassword ? (
              <p className="text-xs text-destructive">{state.fieldErrors.confirmPassword[0]}</p>
            ) : null}
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" variant="outline" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <UserRound />}
              {pending ? 'Updating…' : 'Change password'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
