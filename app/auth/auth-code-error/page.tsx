'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-600">Authentication Error</CardTitle>
          <CardDescription>
            There was a problem confirming your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
            <p className="font-medium mb-2">Possible reasons:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>The confirmation link has expired</li>
              <li>The link has already been used</li>
              <li>The link is invalid or malformed</li>
            </ul>
          </div>
          <div className="text-sm text-slate-600">
            <p className="font-medium mb-1">What to do next:</p>
            <ul className="list-decimal list-inside space-y-1">
              <li>Try logging in - your email may already be confirmed</li>
              <li>Request a new magic link from the login page</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/signup">Sign up again</Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href="/login">Go to login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
