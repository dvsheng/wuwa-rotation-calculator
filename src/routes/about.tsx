import { Link, createFileRoute } from '@tanstack/react-router';
import { BookOpenText, Calculator, Database, Library } from 'lucide-react';

import addAttackVideo from '@/assets/about/AddAttack.mov';
import addBuffVideo from '@/assets/about/AddBuff.mov';
import configureTeamImage from '@/assets/about/ConfigureTeam.png';
import rotationResultsImage from '@/assets/about/RotationResults.png';
import saveRotationImage from '@/assets/about/SaveRotation.png';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container, Grid, Row, Stack } from '@/components/ui/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/typography';

const WORKFLOW_STEPS = [
  {
    value: 'team',
    label: '1. Team Setup',
    title: 'Build your team',
    body: 'Configure your characters, weapons, echoes, echo sets, substats and enemy resistances.',
    media: {
      kind: 'image' as const,
      source: configureTeamImage,
      alt: 'Team setup screen showing character and equipment configuration.',
    },
  },
  {
    value: 'attacks',
    label: '2. Add Attacks',
    title: 'Add attacks to your rotation',
    body: 'Use the palette on the left-hand side of the Rotation view to add attacks to the rotation.',
    media: {
      kind: 'video' as const,
      source: addAttackVideo,
      alt: 'Video demonstrating attacks being added to the rotation timeline.',
    },
  },
  {
    value: 'buffs',
    label: '3. Add Buffs',
    title: 'Line up buffs with your attacks',
    body: 'At the bottom of the palette, line up buffs and debuffs against your rotation attacks to apply them to the attack damage calculation.',
    media: {
      kind: 'video' as const,
      source: addBuffVideo,
      alt: 'Video demonstrating buffs being aligned with attacks on the timeline.',
    },
  },
  {
    value: 'results',
    label: '4. Review Results',
    title: 'Review results and iterate',
    body: 'The Results tab summarizes total damage, breakdowns, and sensitivity data.',
    media: {
      kind: 'image' as const,
      source: rotationResultsImage,
      alt: 'Results view showing total damage and detailed rotation analysis.',
    },
  },
  {
    value: 'save',
    label: '5. Save & Share',
    title: 'Save and share your rotations',
    body: 'Save rotations that you want to revisit and share with other people.',
    media: {
      kind: 'image' as const,
      source: saveRotationImage,
      alt: 'Library workflow showing a rotation being saved for later reference.',
    },
  },
] as const;

const WorkflowMedia = ({ step }: { step: (typeof WORKFLOW_STEPS)[number] }) => {
  if (step.media.kind === 'video') {
    return (
      <video
        src={step.media.source}
        className="bg-secondary/25 w-full rounded-xl border shadow-sm"
        autoPlay
        muted
        loop
        playsInline
        controls
      >
        {step.media.alt}
      </video>
    );
  }

  return (
    <img
      src={step.media.source}
      alt={step.media.alt}
      className="bg-secondary/25 w-full rounded-xl border shadow-sm"
    />
  );
};

function AboutPage() {
  return (
    <div className="from-background via-secondary/30 to-primary/10 h-full min-h-0 flex-1 overflow-auto bg-linear-to-b">
      <Container padding="page" className="max-w-5xl">
        <Stack gap="panel">
          <Stack gap="component" className="max-w-3xl">
            <Row gap="inset" align="center">
              <BookOpenText className="h-7 w-7" />
              <Text as="h1" variant="display" className="text-4xl">
                About I.R.I.S.
              </Text>
            </Row>
            <Text variant="body" tone="muted" className="text-lg leading-8">
              I.R.I.S. Rotation Inspector is a theorycrafting tool for Wuthering Waves.
              This site helps you build and analyze teams and rotations, automating some
              of the manual spreadsheet maintenance that comes with traditional
              theorycrafting.
            </Text>
          </Stack>
          <Grid gap="component" className="md:grid-cols-3">
            <Card className="min-w-0 flex-1">
              <CardHeader>
                <Row gap="inset" align="center">
                  <Calculator className="h-5 w-5" />
                  <CardTitle>Create</CardTitle>
                </Row>
              </CardHeader>
              <CardContent>
                <Stack gap="trim">
                  <Text tone="muted" className="leading-7">
                    Configure a team and build a rotation timeline. Once configured, the
                    rotation calculator will output a damage analysis of the rotation.
                  </Text>
                  <Button asChild variant="outline">
                    <Link to="/create">Open Builder</Link>
                  </Button>
                </Stack>
              </CardContent>
            </Card>
            <Card className="min-w-0 flex-1">
              <CardHeader>
                <Row gap="inset" align="center">
                  <Library className="h-5 w-5" />
                  <CardTitle>Builds</CardTitle>
                </Row>
              </CardHeader>
              <CardContent>
                <Stack gap="trim">
                  <Text tone="muted" className="leading-7">
                    Save and manage rotations that you have created. You can also view
                    rotations that others have created and made public.
                  </Text>
                  <Button asChild>
                    <Link to="/builds">Browse Builds</Link>
                  </Button>
                </Stack>
              </CardContent>
            </Card>
            <Card className="min-w-0 flex-1">
              <CardHeader>
                <Row gap="inset" align="center">
                  <Database className="h-5 w-5" />
                  <CardTitle>Entities</CardTitle>
                </Row>
              </CardHeader>
              <CardContent>
                <Stack gap="trim">
                  <Text tone="muted" className="leading-7">
                    Browse characters, weapons, echoes, echo sets and their
                    representations in the calculator
                  </Text>
                  <Button asChild variant="outline">
                    <Link to="/entities">Open Entities</Link>
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Card>
            <CardHeader>
              <CardTitle>Recommended workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={WORKFLOW_STEPS[0].value} className="gap-component">
                <TabsList className="flex h-auto! w-full flex-wrap justify-start">
                  {WORKFLOW_STEPS.map((step) => (
                    <TabsTrigger
                      key={step.value}
                      value={step.value}
                      className="min-w-28"
                    >
                      {step.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {WORKFLOW_STEPS.map((step) => (
                  <TabsContent key={step.value} value={step.value}>
                    <div className="gap-component grid items-start lg:grid-cols-5">
                      <Stack gap="trim" className="min-w-0 lg:col-span-2">
                        <Text as="h2" variant="heading">
                          {step.title}
                        </Text>
                        <Text tone="muted" className="leading-7">
                          {step.body}
                        </Text>
                      </Stack>
                      <div className="min-w-0 lg:col-span-3">
                        <WorkflowMedia step={step} />
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Important Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Stack gap="component">
                <Stack gap="trim">
                  <Text as="h2" variant="title">
                    Validate Your Rotations
                  </Text>
                  <Text tone="muted" className="leading-7">
                    This tool does not stop you from making infeasible rotations.
                    Nothing is stopping you from creating a rotation where Aemeath uses
                    her liberation 10 times in a row. This tool aims to make the math
                    involved in theorycrafting easier, but identifying and validating
                    rotations is an exercise left for the user.
                  </Text>
                </Stack>
                <Stack gap="trim">
                  <Text as="h2" variant="title">
                    Most Buffs Need To Be Added Explicitly
                  </Text>
                  <Text tone="muted" className="leading-7">
                    Similar to the above point, this tool does not try to deeply
                    simulate game mechanics in Wuthering Waves. As a result, it will not
                    know when certain buffs are active. It is up to the user to say that
                    Augusta has X stacks of Blessing of Wan&apos;s Light from Iuno for
                    her attacks. A rough breakdown of tracked versus untracked systems
                    are as follows:
                  </Text>
                  <div className="gap-component grid md:grid-cols-2">
                    <Stack gap="trim">
                      <Text as="h3" variant="label">
                        Tracked by the calculator
                      </Text>
                      <ul className="text-muted-foreground list-disc space-y-2 pl-5 text-sm leading-7">
                        <li>Character, weapon, echo, and enemy stats</li>
                        <li>
                          Numerical values for attacks, buffs, and debuffs. This
                          includes buffs that are dynamically resolved, such as
                          Shorekeeper's crit buffs based on her energy recharge.
                        </li>
                        <li>
                          The targets of buffs and debuffs. For example, if you align a
                          Lynae self-buff with a Mornye attack, Moryne will not have the
                          buff applied to her.
                        </li>
                      </ul>
                    </Stack>
                    <Stack gap="trim">
                      <Text as="h3" variant="label">
                        Determined by the user
                      </Text>
                      <ul className="text-muted-foreground list-disc space-y-2 pl-5 text-sm leading-7">
                        <li>
                          Whether a buff should be active at a specific point in the
                          rotation
                        </li>
                        <li>
                          Whether the sequence of attacks defined in the rotation is
                          possible to do in game.
                        </li>
                        <li>
                          For stackable buffs, how many stacks the buff has at a
                          specific point in the rotation.
                        </li>
                        <li>
                          Character-specific mechanics, such as what mode Aemeath or
                          Phoeobe is in, or how much Blaze stacks Zani has
                        </li>
                      </ul>
                    </Stack>
                  </div>
                </Stack>
                <Stack gap="trim">
                  <Text as="h2" variant="title">
                    Check Your Results
                  </Text>
                  <Text tone="muted" className="leading-7">
                    For the most part, the numerical game data this calculator depends
                    on is generated through AI. While I've done my best to validate its
                    outputs, I've undoubtedly missed things. The rotation result
                    section's By Attack tab provides very detailed breakdowns of exactly
                    how each number is calculated. Additionally, the raw JSON used to
                    model attacks and buffs are available on the Entities page. Feel
                    free to report any incorrect data you see and I'll do my best to
                    correct it ASAP.
                  </Text>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Q&amp;A</CardTitle>
            </CardHeader>
            <CardContent>
              <Stack gap="component">
                <Stack gap="trim">
                  <Text as="h2" variant="title">
                    I have a feature request. How do I submit it?
                  </Text>
                  <Text as="div" tone="muted" className="leading-7">
                    Please submit it on my{' '}
                    <a
                      href="https://discord.gg/PmvAr2tx"
                      target="_blank"
                      rel="noreferrer"
                      className="text-foreground underline underline-offset-4"
                    >
                      Discord server
                    </a>{' '}
                    via the <code>feature-requests</code> channel
                  </Text>
                </Stack>
                <Stack gap="trim">
                  <Text as="h2" variant="title">
                    I think the calculator is wrong. What should I do?
                  </Text>
                  <Text as="div" tone="muted" className="leading-7">
                    If the game data is incorrect, please go to the respective
                    capability in the entities tab and report an issue through the
                    button. If you feel that a calculation is fundamentally being done
                    incorrectly, let me know via the <code>platform-issues</code>{' '}
                    channel what you think is incorrect. I don't do theorycrafting
                    regularly, so you're probably right.
                  </Text>
                </Stack>
                <Stack gap="trim">
                  <Text as="h2" variant="title">
                    How do you source your data?
                  </Text>
                  <Text as="div" tone="muted" className="leading-7">
                    Most of my data is pulled by crawling{' '}
                    <a
                      href="https://encore.moe"
                      target="_blank"
                      rel="noreferrer"
                      className="text-foreground underline underline-offset-4"
                    >
                      encore.moe
                    </a>
                    , followed by some light data transformations and a workflow for an
                    AI to parse the data into my internal representation of buffs and
                    attacks. I&apos;ll typically update my site within a few days of new
                    data updates to Encore.
                  </Text>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </div>
  );
}

export const Route = createFileRoute('/about')({
  component: AboutPage,
});
