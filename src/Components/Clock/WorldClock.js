import React, { useState, useEffect } from 'react';
import { Select, Button, Input } from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';

const { Option } = Select;

// Major world timezones with cities
const timezones = [
  { id: 'Pacific/Midway', city: 'Midway Island', offset: -11 },
  { id: 'Pacific/Honolulu', city: 'Honolulu', country: 'USA', offset: -10 },
  { id: 'America/Anchorage', city: 'Anchorage', country: 'USA', offset: -9 },
  { id: 'America/Los_Angeles', city: 'Los Angeles', country: 'USA', offset: -8 },
  { id: 'America/Denver', city: 'Denver', country: 'USA', offset: -7 },
  { id: 'America/Chicago', city: 'Chicago', country: 'USA', offset: -6 },
  { id: 'America/New_York', city: 'New York', country: 'USA', offset: -5 },
  { id: 'America/Caracas', city: 'Caracas', country: 'Venezuela', offset: -4 },
  { id: 'America/Sao_Paulo', city: 'São Paulo', country: 'Brazil', offset: -3 },
  { id: 'Atlantic/South_Georgia', city: 'South Georgia', offset: -2 },
  { id: 'Atlantic/Azores', city: 'Azores', country: 'Portugal', offset: -1 },
  { id: 'Europe/London', city: 'London', country: 'UK', offset: 0 },
  { id: 'Europe/Paris', city: 'Paris', country: 'France', offset: 1 },
  { id: 'Europe/Berlin', city: 'Berlin', country: 'Germany', offset: 1 },
  { id: 'Europe/Istanbul', city: 'Istanbul', country: 'Turkey', offset: 3 },
  { id: 'Asia/Dubai', city: 'Dubai', country: 'UAE', offset: 4 },
  { id: 'Asia/Karachi', city: 'Karachi', country: 'Pakistan', offset: 5 },
  { id: 'Asia/Kolkata', city: 'Mumbai', country: 'India', offset: 5.5 },
  { id: 'Asia/Dhaka', city: 'Dhaka', country: 'Bangladesh', offset: 6 },
  { id: 'Asia/Bangkok', city: 'Bangkok', country: 'Thailand', offset: 7 },
  { id: 'Asia/Singapore', city: 'Singapore', country: 'Singapore', offset: 8 },
  { id: 'Asia/Shanghai', city: 'Shanghai', country: 'China', offset: 8 },
  { id: 'Asia/Hong_Kong', city: 'Hong Kong', country: 'China', offset: 8 },
  { id: 'Asia/Tokyo', city: 'Tokyo', country: 'Japan', offset: 9 },
  { id: 'Asia/Seoul', city: 'Seoul', country: 'South Korea', offset: 9 },
  { id: 'Australia/Sydney', city: 'Sydney', country: 'Australia', offset: 11 },
  { id: 'Pacific/Auckland', city: 'Auckland', country: 'New Zealand', offset: 13 },
];

// Storage helper
const storage = {
  get: (key, defaultValue) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }
};

// Clock Card Component
const ClockCard = ({ timezone, onRemove, isLocal }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getTimeInZone = () => {
    try {
      return time.toLocaleTimeString('en-US', {
        timeZone: timezone.id,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return time.toLocaleTimeString();
    }
  };

  const getSecondsInZone = () => {
    try {
      return time.toLocaleTimeString('en-US', {
        timeZone: timezone.id,
        second: '2-digit'
      }).split(' ')[0];
    } catch (e) {
      return time.getSeconds().toString().padStart(2, '0');
    }
  };

  const getDateInZone = () => {
    try {
      return time.toLocaleDateString('en-US', {
        timeZone: timezone.id,
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return time.toLocaleDateString();
    }
  };

  const getOffset = () => {
    const offset = timezone.offset;
    const sign = offset >= 0 ? '+' : '';
    return `UTC${sign}${offset}`;
  };

  const isDaytime = () => {
    try {
      const hour = parseInt(time.toLocaleTimeString('en-US', {
        timeZone: timezone.id,
        hour: 'numeric',
        hour12: false
      }));
      return hour >= 6 && hour < 18;
    } catch (e) {
      return true;
    }
  };

  return (
    <div style={{
      background: isLocal 
        ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
        : isDaytime() 
          ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
          : 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)',
      borderRadius: '20px',
      padding: '24px',
      color: 'white',
      position: 'relative',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
    }}>
      {!isLocal && (
        <button
          onClick={onRemove}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <DeleteOutlined />
        </button>
      )}
      
      <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>
        {isLocal ? '📍 Local Time' : isDaytime() ? '☀️' : '🌙'} {timezone.city}
        {timezone.country && `, ${timezone.country}`}
      </div>
      
      <div style={{
        fontSize: '42px',
        fontWeight: '200',
        fontFamily: "'Inter', monospace",
        letterSpacing: '-1px',
        margin: '8px 0',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'baseline',
        gap: '4px'
      }}>
        <span>{getTimeInZone()}</span>
        <span style={{ fontSize: '20px', opacity: 0.6 }}>:{getSecondsInZone()}</span>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', opacity: 0.9 }}>{getDateInZone()}</span>
        <span style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px'
        }}>
          {getOffset()}
        </span>
      </div>
    </div>
  );
};

// Time Difference Component
const TimeDifference = ({ from, to }) => {
  const diff = to.offset - from.offset;
  const absDiff = Math.abs(diff);
  const hours = Math.floor(absDiff);
  const minutes = (absDiff - hours) * 60;
  
  return (
    <div style={{
      background: '#f8fafc',
      borderRadius: '12px',
      padding: '16px',
      textAlign: 'center',
      margin: '16px 0'
    }}>
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
        Time Difference
      </div>
      <div style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
        {diff > 0 ? '+' : diff < 0 ? '-' : ''}
        {hours > 0 && `${hours}h `}
        {minutes > 0 && `${minutes}m`}
        {diff === 0 && 'Same timezone'}
      </div>
      <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
        {to.city} is {diff > 0 ? 'ahead of' : diff < 0 ? 'behind' : 'same as'} {from.city}
      </div>
    </div>
  );
};

const WorldClock = () => {
  const [clocks, setClocks] = useState(() => {
    const saved = storage.get('worldClocks', []);
    return saved.length > 0 ? saved : [
      timezones.find(t => t.id === 'America/New_York'),
      timezones.find(t => t.id === 'Europe/London'),
    ];
  });
  const [selectedTimezone, setSelectedTimezone] = useState(null);
  const [searchText, setSearchText] = useState('');

  // Get local timezone
  const localTimezone = {
    id: Intl.DateTimeFormat().resolvedOptions().timeZone,
    city: 'Your Location',
    offset: -new Date().getTimezoneOffset() / 60
  };

  useEffect(() => {
    storage.set('worldClocks', clocks);
  }, [clocks]);

  const addClock = () => {
    if (selectedTimezone && !clocks.find(c => c.id === selectedTimezone)) {
      const tz = timezones.find(t => t.id === selectedTimezone);
      if (tz) {
        setClocks([...clocks, tz]);
        setSelectedTimezone(null);
      }
    }
  };

  const removeClock = (id) => {
    setClocks(clocks.filter(c => c.id !== id));
  };

  const filteredTimezones = timezones.filter(tz => 
    !clocks.find(c => c.id === tz.id) &&
    (tz.city.toLowerCase().includes(searchText.toLowerCase()) ||
     (tz.country && tz.country.toLowerCase().includes(searchText.toLowerCase())))
  );

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌍</div>
        <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '600' }}>
          World Clock
        </h2>
        <p style={{ margin: 0, color: '#6b7280' }}>
          Track time across multiple cities around the world
        </p>
      </div>

      {/* Add Clock Section */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Select
            showSearch
            placeholder="Search for a city..."
            value={selectedTimezone}
            onChange={setSelectedTimezone}
            onSearch={setSearchText}
            filterOption={false}
            style={{ flex: 1 }}
            size="large"
            suffixIcon={<SearchOutlined />}
          >
            {filteredTimezones.map(tz => (
              <Option key={tz.id} value={tz.id}>
                {tz.city}{tz.country && `, ${tz.country}`} (UTC{tz.offset >= 0 ? '+' : ''}{tz.offset})
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addClock}
            size="large"
            disabled={!selectedTimezone}
          >
            Add City
          </Button>
        </div>
      </div>

      {/* Clocks Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px'
      }}>
        {/* Local Clock */}
        <ClockCard timezone={localTimezone} isLocal={true} />
        
        {/* Added Clocks */}
        {clocks.map(clock => (
          <ClockCard
            key={clock.id}
            timezone={clock}
            onRemove={() => removeClock(clock.id)}
          />
        ))}
      </div>

      {/* Time Comparison */}
      {clocks.length > 0 && (
        <div style={{
          marginTop: '24px',
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
        }}>
          <h4 style={{ margin: '0 0 16px', fontWeight: '600' }}>
            ⏱️ Quick Comparison with Your Local Time
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {clocks.map(clock => (
              <TimeDifference key={clock.id} from={localTimezone} to={clock} />
            ))}
          </div>
        </div>
      )}

      {/* Meeting Planner Hint */}
      <div style={{
        marginTop: '24px',
        padding: '20px',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        borderRadius: '16px',
        borderLeft: '4px solid #22c55e'
      }}>
        <h4 style={{ margin: '0 0 8px', fontWeight: '600', color: '#166534' }}>
          💡 Pro Tip: Meeting Planner
        </h4>
        <p style={{ margin: 0, fontSize: '14px', color: '#166534' }}>
          Use these clocks to find the best meeting time across different timezones. 
          Look for overlapping business hours (9 AM - 5 PM) in each location.
        </p>
      </div>
    </div>
  );
};

export default WorldClock;
