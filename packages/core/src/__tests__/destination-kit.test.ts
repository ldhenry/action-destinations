import { Destination, DestinationDefinition } from '../destination-kit'
import { JSONObject } from '../json-object'
import { SegmentEvent } from '../segment-event'

const destinationCustomAuth: DestinationDefinition<JSONObject> = {
  name: 'Actions Google Analytic 4',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      apiSecret: {
        label: 'API secret',
        description: 'Api key',
        type: 'string',
        required: true
      }
    }
  },
  actions: {
    customEvent: {
      title: 'Send a Custom Event',
      description: 'Send events to a custom event in API',
      defaultSubscription: 'type = "track"',
      fields: {
        optional_field: {
          type: 'number',
          label: 'A',
          description: 'A'
        }
      },
      perform: (_request, { payload }) => {
        return ['this is a test', payload]
      }
    }
  }
}

const destinationOAuth2: DestinationDefinition<JSONObject> = {
  name: 'Actions Google Analytic 4',
  mode: 'cloud',
  authentication: {
    scheme: 'oauth2',
    fields: {
      apiSecret: {
        label: 'API secret',
        description: 'Api key',
        type: 'string',
        required: true
      }
    },
    refreshAccessToken: (_request) => {
      return new Promise((resolve, _reject) => {
        setTimeout(() => {
          resolve({ accessToken: 'fresh-token' })
        }, 3)
      })
    }
  },
  actions: {
    customEvent: {
      title: 'Send a Custom Event',
      description: 'Send events to a custom event in API',
      defaultSubscription: 'type = "track"',
      fields: {},
      perform: (_request) => {
        return 'this is a test'
      }
    }
  }
}

const destinationWithOptions: DestinationDefinition<JSONObject> = {
  name: 'Actions Google Analytic 4',
  mode: 'cloud',
  authentication: {
    scheme: 'oauth2',
    fields: {
      apiSecret: {
        label: 'API secret',
        description: 'Api key',
        type: 'string',
        required: true
      }
    },
    refreshAccessToken: (_request) => {
      return new Promise((resolve, _reject) => {
        setTimeout(() => {
          resolve({ accessToken: 'fresh-token' })
        }, 3)
      })
    }
  },
  actions: {
    customEvent: {
      title: 'Send a Custom Event',
      description: 'Send events to a custom event in API',
      defaultSubscription: 'type = "track"',
      fields: {},
      perform: (_request, { features }) => {
        return features
      }
    }
  }
}

describe('destination kit', () => {
  describe('event validations', () => {
    test('should return `invalid subscription` when sending an empty subscribe', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testEvent: SegmentEvent = { type: 'track' }
      const testSettings = { apiSecret: 'test_key', subscription: { subscribe: '', partnerAction: 'customEvent' } }
      const res = await destinationTest.onEvent(testEvent, testSettings)
      expect(res).toEqual([{ output: 'invalid subscription' }])
    })

    test('should return invalid subscription with details when sending an invalid subscribe', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testEvent: SegmentEvent = { type: 'track' }
      const testSettings = { apiSecret: 'test_key', subscription: { subscribe: 'typo', partnerAction: 'customEvent' } }
      const res = await destinationTest.onEvent(testEvent, testSettings)
      expect(res).toEqual([{ output: "invalid subscription : Cannot read property 'type' of undefined" }])
    })

    test('should return `not subscribed` when providing an empty event', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testSettings = {
        apiSecret: 'test_key',
        subscription: { subscribe: 'type = "track"', partnerAction: 'customEvent' }
      }
      // @ts-ignore needed for replicating empty event at runtime
      const res = await destinationTest.onEvent({}, testSettings)
      expect(res).toEqual([{ output: 'not subscribed' }])
    })

    test('should fail if provided invalid settings', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testEvent: SegmentEvent = { type: 'track' }
      const testSettings = {
        apiSecret: undefined,
        subscription: { subscribe: 'type = "track"', partnerAction: 'customEvent' }
      }
      // @ts-expect-error we are missing valid settings on purpose!
      const promise = destinationTest.onEvent(testEvent, testSettings)
      await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
        `"The root value is missing the required field 'apiSecret'."`
      )
    })

    test('should succeed if provided with a valid event & settings', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testEvent: SegmentEvent = {
        properties: { field_one: 'test input' },
        userId: '3456fff',
        type: 'track'
      }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            clientId: '23455343467',
            name: 'fancy_event',
            parameters: { field_one: 'rogue one' }
          }
        }
      }

      const res = await destinationTest.onEvent(testEvent, testSettings)
      expect(res).toEqual([
        { output: 'Mappings resolved' },
        { output: 'Payload validated' },
        { output: ['this is a test', {}] }
      ])
    })

    test('should succeed when traits filtering is specified', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testEvent: SegmentEvent = {
        properties: { field_one: 'test input' },
        traits: {
          a: 'foo'
        },
        userId: '3456fff',
        type: 'identify'
      }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "identify" and traits.a = "foo"',
          partnerAction: 'customEvent',
          mapping: {
            clientId: '23455343467',
            name: 'fancy_event',
            parameters: { field_one: 'rogue one' }
          }
        }
      }

      const res = await destinationTest.onEvent(testEvent, testSettings)
      expect(res).toEqual([
        { output: 'Mappings resolved' },
        { output: 'Payload validated' },
        { output: ['this is a test', {}] }
      ])
    })

    test('should succeed when property filtering is specified', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testEvent: SegmentEvent = {
        properties: { a: 'foo', field_one: 'test input' },
        traits: {
          b: 'foo'
        },
        userId: '3456fff',
        type: 'identify'
      }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "identify" and properties.a = "foo"',
          partnerAction: 'customEvent',
          mapping: {
            clientId: '23455343467',
            name: 'fancy_event',
            parameters: { field_one: 'rogue one' }
          }
        }
      }

      const res = await destinationTest.onEvent(testEvent, testSettings)
      expect(res).toEqual([
        { output: 'Mappings resolved' },
        { output: 'Payload validated' },
        { output: ['this is a test', {}] }
      ])
    })
  })

  describe('payload mapping + validation', () => {
    test('removes empty values from the payload', async () => {
      const destinationTest = new Destination(destinationCustomAuth)

      const testEvent: SegmentEvent = {
        properties: { field_one: 'test input' },
        userId: '3456fff',
        type: 'track'
      }

      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            // Intentionally empty, to get stripped out
            optional_field: ''
          }
        }
      }

      const res = await destinationTest.onEvent(testEvent, testSettings)
      expect(res).toEqual([
        { output: 'Mappings resolved' },
        { output: 'Payload validated' },
        { output: ['this is a test', {}] }
      ])
    })
  })

  describe('refresh token', () => {
    test('should throw a `NotImplemented` error', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testSettings = {
        subscription: { subscribe: '', partnerAction: 'customEvent' }
      }
      const oauthData = {
        accessToken: 'test-access-token',
        refreshToken: 'refresh-token',
        clientId: 'test-clientid',
        clientSecret: 'test-clientsecret'
      }
      try {
        await destinationTest.refreshAccessToken(testSettings, oauthData)
        fail('test should have thrown a NotImplemented error')
      } catch (e) {
        expect(e.status).toEqual(501)
        expect(e.message).toEqual('refreshAccessToken is only valid with oauth2 authentication scheme')
        expect(e.code).toEqual('NotImplemented')
      }
    })

    test('should throw a `NotImplemented` error', async () => {
      const destinationTest = new Destination(destinationOAuth2)
      const testSettings = {
        subscription: { subscribe: 'type = "track"', partnerAction: 'customEvent' }
      }
      const oauthData = {
        accessToken: 'test-access-token',
        refreshToken: 'refresh-token',
        clientId: 'test-clientid',
        clientSecret: 'test-clientsecret'
      }
      const res = await destinationTest.refreshAccessToken(testSettings, oauthData)

      expect(res).toEqual({ accessToken: 'fresh-token' })
    })
  })

  describe('features', () => {
    test('should not crash when features are passed to the perform handler', async () => {
      const destinationTest = new Destination(destinationWithOptions)
      const testEvent: SegmentEvent = {
        properties: { field_one: 'test input' },
        userId: '3456fff',
        type: 'track'
      }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            clientId: '23455343467',
            name: 'fancy_event',
            parameters: { field_one: 'rogue one' }
          }
        }
      }
      const eventOptions = {
        features: {
          test_feature: true
        }
      }

      const res = await destinationTest.onEvent(testEvent, testSettings, eventOptions)

      expect(res).toEqual([
        { output: 'Mappings resolved' },
        {
          output: {
            ...eventOptions.features
          }
        }
      ])
    })
  })
})
