import {
  Icon,
  NavigationRail,
  NavigationRailItem,
  NavigationRailSection,
} from '@material-web/react'
import { Text } from 'react-aria-components'
import { SlotCanvas, SlotPicture } from '../components/slot-picture'

/** The slot of a navigation rail item: its label, beside its icon in an expanded rail. */
export function NavigationRailItemSlots({ showLegend }: { showLegend?: boolean }) {
  return (
    <SlotPicture slots={['label']} showLegend={showLegend}>
      <SlotCanvas>
        <NavigationRail aria-label="Main" isExpanded>
          <NavigationRailItem isSelected>
            <Icon name="inbox" />
            <Text slot="label">Inbox</Text>
          </NavigationRailItem>
          <NavigationRailItem>
            <Icon name="send" />
            <Text slot="label">Outbox</Text>
          </NavigationRailItem>
        </NavigationRail>
      </SlotCanvas>
    </SlotPicture>
  )
}

/** The slot of a navigation rail section: its header. */
export function NavigationRailSectionSlots({ showLegend }: { showLegend?: boolean }) {
  return (
    <SlotPicture slots={['header']} showLegend={showLegend}>
      <SlotCanvas>
        <NavigationRail aria-label="Main" isExpanded>
          <NavigationRailSection aria-labelledby="slots-sleep-well">
            <Text slot="header" id="slots-sleep-well">
              Sleep well
            </Text>
            <NavigationRailItem>
              <Icon name="bed" />
              <Text slot="label">Bedtime</Text>
            </NavigationRailItem>
          </NavigationRailSection>
        </NavigationRail>
      </SlotCanvas>
    </SlotPicture>
  )
}
